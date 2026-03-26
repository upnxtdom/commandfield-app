const { Router } = require("express");
const supabase = require("../lib/supabase");

const router = Router();

router.get("/:business_id", async (req, res) => {
  const { business_id } = req.params;
  try {
    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("business_id", business_id)
      .order("scheduled_at", { ascending: false });

    if (error) return res.json({ success: false, error: error.message });

    const workerIds = [...new Set(jobs.map((j) => j.worker_id).filter(Boolean))];
    const customerIds = [...new Set(jobs.map((j) => j.customer_id).filter(Boolean))];

    const [{ data: workers }, { data: customers }] = await Promise.all([
      workerIds.length
        ? supabase.from("workers").select("id, name").in("id", workerIds)
        : { data: [] },
      customerIds.length
        ? supabase.from("customers").select("id, name").in("id", customerIds)
        : { data: [] },
    ]);

    const workerMap = Object.fromEntries((workers || []).map((w) => [w.id, w.name]));
    const customerMap = Object.fromEntries((customers || []).map((c) => [c.id, c.name]));

    const enriched = jobs.map((j) => ({
      ...j,
      worker_name: workerMap[j.worker_id] || null,
      customer_name: customerMap[j.customer_id] || null,
    }));

    return res.json({ success: true, data: enriched });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { business_id, worker_id, customer_id, title, job_type, scheduled_at, address, notes } = req.body;
  try {
    const { data, error } = await supabase
      .from("jobs")
      .insert({
        business_id,
        worker_id,
        customer_id,
        title,
        job_type,
        scheduled_at,
        address,
        notes,
        status: "scheduled",
      })
      .select()
      .single();

    if (error) return res.json({ success: false, error: error.message });
    return res.json({ success: true, data });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };

  if (updates.status === "in_progress") {
    updates.started_at = new Date().toISOString();
  }
  if (updates.status === "completed") {
    updates.completed_at = new Date().toISOString();
  }

  try {
    const { data, error } = await supabase
      .from("jobs")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.json({ success: false, error: error.message });
    return res.json({ success: true, data });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from("jobs")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (error) return res.json({ success: false, error: error.message });
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

router.get("/:id/timeline", async (req, res) => {
  const { id } = req.params;
  try {
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (jobError) return res.json({ success: false, error: jobError.message });

    const timeline = [];

    if (job.created_at) {
      timeline.push({ status: "scheduled", timestamp: job.created_at });
    }
    if (job.started_at) {
      timeline.push({ status: "in_progress", timestamp: job.started_at });
    }
    if (job.completed_at) {
      timeline.push({ status: "completed", timestamp: job.completed_at });
    }
    if (job.status === "cancelled") {
      timeline.push({ status: "cancelled", timestamp: job.updated_at || job.created_at });
    }

    return res.json({ success: true, job, timeline });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

module.exports = router;
