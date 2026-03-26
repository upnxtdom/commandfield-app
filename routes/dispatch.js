const { Router } = require("express");
const supabase = require("../lib/supabase");
const twilio = require("../lib/twilio");
const { parseCommand } = require("../lib/parser");

const router = Router();

const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// ─── SMS helpers ───────────────────────────────────────────────────────────────

async function sendSMS(to, body) {
  try {
    await twilio.messages.create({ from: FROM_NUMBER, to, body });
  } catch (err) {
    console.error("SMS send error:", err.message);
  }
}

function twiml(reply) {
  return `<?xml version="1.0"?><Response><Message>${reply}</Message></Response>`;
}

async function logCommand(business_id, user_id, raw_text, command_type, reply) {
  await supabase.from("dispatch_commands").insert({
    business_id,
    user_id,
    raw_text,
    command_type,
    reply,
  });
}

// ─── Handlers ──────────────────────────────────────────────────────────────────

async function handleAssign(parsed, business_id) {
  const { job_type, worker_tag, date, time, address, customer_tag } = parsed;

  const [{ data: workers }, { data: customers }] = await Promise.all([
    supabase.from("workers").select("*").eq("business_id", business_id).ilike("name", `%${worker_tag}%`),
    supabase.from("customers").select("*").eq("business_id", business_id).ilike("name", `%${customer_tag}%`),
  ]);

  const worker = workers && workers[0];
  const customer = customers && customers[0];

  if (!worker) return `Worker @${worker_tag} not found.`;
  if (!customer) return `Customer @${customer_tag} not found.`;

  const scheduled_at = new Date(`${date} ${time}`).toISOString();

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      business_id,
      worker_id: worker.id,
      customer_id: customer.id,
      title: job_type,
      job_type,
      scheduled_at,
      address,
      status: "scheduled",
    })
    .select()
    .single();

  if (error) return `Failed to create job: ${error.message}`;

  await Promise.all([
    sendSMS(
      worker.phone,
      `New job: ${job_type} at ${address} on ${date} at ${time}. Client: ${customer.name}. Reply START when on your way.`
    ),
    sendSMS(
      customer.phone,
      `CommandField has scheduled ${job_type} for ${date} at ${time}. Tech: ${worker.name}. Questions? Reply here.`
    ),
  ]);

  return `Job assigned: ${job_type} → @${worker.name} on ${date} at ${time} for ${customer.name}.`;
}

async function handleJobsToday(business_id) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("*, workers(name)")
    .eq("business_id", business_id)
    .gte("scheduled_at", start.toISOString())
    .lte("scheduled_at", end.toISOString())
    .order("scheduled_at", { ascending: true });

  if (error || !jobs || jobs.length === 0) return "No jobs scheduled for today.";

  const lines = jobs.map((j, i) => {
    const timeStr = j.scheduled_at
      ? new Date(j.scheduled_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      : "TBD";
    const workerName = j.workers ? j.workers.name : "Unassigned";
    return `${i + 1}. ${j.job_type || j.title} @${workerName} - ${timeStr} - ${j.status}`;
  });

  return `Jobs Today:\n${lines.join("\n")}`;
}

async function handleKPI(business_id, period) {
  const now = new Date();
  let start;

  if (period === "today") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === "week") {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const startStr = start.toISOString();
  const endStr = end.toISOString();

  const [
    { count: scheduled },
    { count: inProgress },
    { count: completed },
    { data: paidInvoices },
    { count: activeWorkers },
  ] = await Promise.all([
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("business_id", business_id).eq("status", "scheduled").gte("scheduled_at", startStr).lt("scheduled_at", endStr),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("business_id", business_id).eq("status", "in_progress"),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("business_id", business_id).eq("status", "completed").gte("completed_at", startStr).lt("completed_at", endStr),
    supabase.from("invoices").select("amount").eq("business_id", business_id).eq("status", "paid").gte("paid_at", startStr).lt("paid_at", endStr),
    supabase.from("workers").select("*", { count: "exact", head: true }).eq("business_id", business_id).eq("status", "active"),
  ]);

  const revenue = (paidInvoices || []).reduce((s, i) => s + (i.amount || 0), 0);

  return `KPI ${period}:\nScheduled: ${scheduled || 0}\nIn Progress: ${inProgress || 0}\nCompleted: ${completed || 0}\nRevenue: $${revenue.toFixed(2)}\nWorkers Active: ${activeWorkers || 0}`;
}

async function handleStart(sender_phone, business_id) {
  const { data: worker } = await supabase
    .from("workers")
    .select("*")
    .eq("business_id", business_id)
    .eq("phone", sender_phone)
    .single();

  if (!worker) return "Worker not found for your number.";

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("business_id", business_id)
    .eq("worker_id", worker.id)
    .in("status", ["scheduled", "in_progress"])
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .single();

  if (!job) return "No active job found for you.";

  await supabase
    .from("jobs")
    .update({ status: "in_progress", started_at: new Date().toISOString() })
    .eq("id", job.id);

  const timeStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("business_id", business_id)
    .eq("role", "owner")
    .limit(1)
    .single();

  if (ownerProfile && ownerProfile.phone) {
    await sendSMS(ownerProfile.phone, `${worker.name} started ${job.job_type || job.title} at ${job.address}. ${timeStr}`);
  }

  if (job.customer_id) {
    const { data: customer } = await supabase.from("customers").select("*").eq("id", job.customer_id).single();
    if (customer && customer.phone) {
      await sendSMS(customer.phone, `Your tech ${worker.name} is on the way!`);
    }
  }

  return "Job started. Good luck!";
}

async function handleDone(sender_phone, business_id) {
  const { data: worker } = await supabase
    .from("workers")
    .select("*")
    .eq("business_id", business_id)
    .eq("phone", sender_phone)
    .single();

  if (!worker) return "Worker not found for your number.";

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("business_id", business_id)
    .eq("worker_id", worker.id)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  if (!job) return "No in-progress job found for you.";

  await supabase
    .from("jobs")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", job.id);

  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("business_id", business_id)
    .eq("role", "owner")
    .limit(1)
    .single();

  if (job.customer_id) {
    const { data: customer } = await supabase.from("customers").select("*").eq("id", job.customer_id).single();
    if (ownerProfile && ownerProfile.phone && customer) {
      await sendSMS(
        ownerProfile.phone,
        `${worker.name} completed ${job.job_type || job.title} at ${job.address}. Reply INVOICE @${customer.name} to send invoice.`
      );
    }
  }

  return "Job marked complete. Great work!";
}

async function handleMyJobs(sender_phone, business_id) {
  const { data: worker } = await supabase
    .from("workers")
    .select("*")
    .eq("business_id", business_id)
    .eq("phone", sender_phone)
    .single();

  if (!worker) return "Worker not found for your number.";

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("business_id", business_id)
    .eq("worker_id", worker.id)
    .in("status", ["scheduled", "in_progress"])
    .gte("scheduled_at", start.toISOString())
    .lte("scheduled_at", end.toISOString())
    .order("scheduled_at", { ascending: true });

  if (!jobs || jobs.length === 0) return "No jobs scheduled for you today.";

  const lines = jobs.map((j, i) => {
    const timeStr = j.scheduled_at
      ? new Date(j.scheduled_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      : "TBD";
    return `${i + 1}. ${j.job_type || j.title} - ${timeStr} - ${j.address} [${j.status}]`;
  });

  return `Your Jobs Today:\n${lines.join("\n")}`;
}

function handleHelp(role) {
  if (role === "worker") {
    return [
      "Worker Commands:",
      "START - Begin your current job",
      "DONE - Mark job complete",
      "ON MY WAY - Notify client",
      "MY JOBS - See your jobs today",
      "ISSUE [description] - Report a problem",
      "CLOCK IN / CLOCK OUT",
      "HELP - Show this menu",
    ].join("\n");
  }
  return [
    "Owner Commands:",
    "ASSIGN [type] TO @[worker] ON [date] AT [time] - [address] - CLIENT @[name]",
    "REASSIGN [job] TO @[worker]",
    "CANCEL JOB [ref]",
    "JOBS TODAY",
    "JOBS @[worker]",
    "KPI TODAY / KPI WEEK / KPI MONTH",
    "WORKERS",
    "CUSTOMER @[name]",
    "INVOICE @[name]",
    "ADD WORKER [name] [phone]",
    "ADD CUSTOMER [name] [phone] [address]",
    "NOTE JOB [ref] [text]",
    "HELP - Show this menu",
  ].join("\n");
}

// ─── Route: execute a parsed command ──────────────────────────────────────────

async function executeCommand(parsed, business_id, sender_phone, role) {
  switch (parsed.type) {
    case "assign":
      return handleAssign(parsed, business_id);
    case "jobs_today":
      return handleJobsToday(business_id);
    case "kpi_today":
      return handleKPI(business_id, "today");
    case "kpi_week":
      return handleKPI(business_id, "week");
    case "kpi_month":
      return handleKPI(business_id, "month");
    case "start":
      return handleStart(sender_phone, business_id);
    case "done":
      return handleDone(sender_phone, business_id);
    case "my_jobs":
      return handleMyJobs(sender_phone, business_id);
    case "help":
      return handleHelp(role);
    case "unknown":
    default:
      return "Command not recognized. Reply HELP for available commands.";
  }
}

// ─── POST /api/dispatch/sms-inbound (Twilio webhook) ─────────────────────────

router.post("/sms-inbound", async (req, res) => {
  const from = req.body.From;
  const body = (req.body.Body || "").trim();

  res.set("Content-Type", "text/xml");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("phone", from)
    .single();

  if (error || !profile) {
    return res.send(twiml("Your number is not registered with CommandField. Contact your administrator."));
  }

  const { id: user_id, business_id, role } = profile;
  const parsed = parseCommand(body);
  const reply = await executeCommand(parsed, business_id, from, role);

  await logCommand(business_id, user_id, body, parsed.type, reply);

  return res.send(twiml(reply));
});

// ─── POST /api/dispatch/command (dashboard input) ─────────────────────────────

router.post("/command", async (req, res) => {
  const { business_id, user_id, text, role } = req.body;

  if (!business_id || !text) {
    return res.json({ success: false, error: "business_id and text are required." });
  }

  const parsed = parseCommand(text);
  const reply = await executeCommand(parsed, business_id, null, role || "owner");

  await logCommand(business_id, user_id, text, parsed.type, reply);

  return res.json({ success: true, command: parsed, reply });
});

// ─── GET /api/dispatch/log/:business_id ───────────────────────────────────────

router.get("/log/:business_id", async (req, res) => {
  const { business_id } = req.params;
  try {
    const { data, error } = await supabase
      .from("dispatch_commands")
      .select("*")
      .eq("business_id", business_id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return res.json({ success: false, error: error.message });
    return res.json({ success: true, data });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

module.exports = router;
