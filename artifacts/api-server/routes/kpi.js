const { Router } = require("express");
const supabase = require("../lib/supabase");

const router = Router();

function getDateRange(period) {
  const now = new Date();
  let start;

  if (period === "today") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === "week") {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
  } else if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

async function buildKpi(business_id, period) {
  const { start, end } = getDateRange(period);

  const [
    { count: jobs_scheduled },
    { count: jobs_in_progress },
    { count: jobs_completed },
    { data: paidInvoices },
    { count: workers_active },
  ] = await Promise.all([
    supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business_id)
      .eq("status", "scheduled")
      .gte("scheduled_at", start)
      .lt("scheduled_at", end),

    supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business_id)
      .eq("status", "in_progress"),

    supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business_id)
      .eq("status", "completed")
      .gte("completed_at", start)
      .lt("completed_at", end),

    supabase
      .from("invoices")
      .select("amount")
      .eq("business_id", business_id)
      .eq("status", "paid")
      .gte("paid_at", start)
      .lt("paid_at", end),

    supabase
      .from("workers")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business_id)
      .eq("status", "active"),
  ]);

  const revenue_today = (paidInvoices || []).reduce((sum, inv) => sum + (inv.amount || 0), 0);

  return {
    jobs_scheduled: jobs_scheduled || 0,
    jobs_in_progress: jobs_in_progress || 0,
    jobs_completed: jobs_completed || 0,
    revenue_today,
    workers_active: workers_active || 0,
  };
}

router.get("/:business_id/today", async (req, res) => {
  try {
    const kpi = await buildKpi(req.params.business_id, "today");
    return res.json({ success: true, data: kpi });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

router.get("/:business_id/week", async (req, res) => {
  try {
    const kpi = await buildKpi(req.params.business_id, "week");
    return res.json({ success: true, data: kpi });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

router.get("/:business_id/month", async (req, res) => {
  try {
    const kpi = await buildKpi(req.params.business_id, "month");
    return res.json({ success: true, data: kpi });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

module.exports = router;
