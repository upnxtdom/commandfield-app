const { Router } = require("express");
const supabase = require("../lib/supabase");

const router = Router();

router.get("/:business_id", async (req, res) => {
  const { business_id } = req.params;
  try {
    const { data, error } = await supabase
      .from("workers")
      .select("*")
      .eq("business_id", business_id)
      .order("created_at", { ascending: true });

    if (error) return res.json({ success: false, error: error.message });
    return res.json({ success: true, data });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { business_id, name, phone, email, role } = req.body;
  try {
    const { data, error } = await supabase
      .from("workers")
      .insert({ business_id, name, phone, email, role })
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
  const { name, phone, email, status } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (email !== undefined) updates.email = email;
  if (status !== undefined) updates.status = status;

  try {
    const { data, error } = await supabase
      .from("workers")
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
      .from("workers")
      .update({ status: "inactive" })
      .eq("id", id);

    if (error) return res.json({ success: false, error: error.message });
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

module.exports = router;
