const { Router } = require("express");
const supabase = require("../lib/supabase");

const router = Router();

router.get("/:business_id", async (req, res) => {
  const { business_id } = req.params;
  try {
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("business_id", business_id)
      .order("created_at", { ascending: false });

    if (error) return res.json({ success: false, error: error.message });

    const customerIds = [...new Set(invoices.map((i) => i.customer_id).filter(Boolean))];
    const jobIds = [...new Set(invoices.map((i) => i.job_id).filter(Boolean))];

    const [{ data: customers }, { data: jobs }] = await Promise.all([
      customerIds.length
        ? supabase.from("customers").select("id, name").in("id", customerIds)
        : { data: [] },
      jobIds.length
        ? supabase.from("jobs").select("id, title").in("id", jobIds)
        : { data: [] },
    ]);

    const customerMap = Object.fromEntries((customers || []).map((c) => [c.id, c.name]));
    const jobMap = Object.fromEntries((jobs || []).map((j) => [j.id, j.title]));

    const enriched = invoices.map((i) => ({
      ...i,
      customer_name: customerMap[i.customer_id] || null,
      job_title: jobMap[i.job_id] || null,
    }));

    return res.json({ success: true, data: enriched });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { business_id, job_id, customer_id, amount } = req.body;
  try {
    const { data, error } = await supabase
      .from("invoices")
      .insert({ business_id, job_id, customer_id, amount, status: "draft" })
      .select()
      .single();

    if (error) return res.json({ success: false, error: error.message });
    return res.json({ success: true, data });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

router.put("/:id/send", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("invoices")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.json({ success: false, error: error.message });
    return res.json({ success: true, data });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

router.put("/:id/paid", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("invoices")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", id)
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
  const { amount, status, notes } = req.body;
  const updates = {};
  if (amount !== undefined) updates.amount = amount;
  if (status !== undefined) updates.status = status;
  if (notes !== undefined) updates.notes = notes;

  try {
    const { data, error } = await supabase
      .from("invoices")
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

module.exports = router;
