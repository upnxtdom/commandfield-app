const { Router } = require("express");
const supabase = require("../lib/supabase");

const router = Router();

router.get("/:business_id", async (req, res) => {
  const { business_id } = req.params;
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("business_id", business_id)
      .order("name", { ascending: true });

    if (error) return res.json({ success: false, error: error.message });
    return res.json({ success: true, data });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { business_id, name, phone, email, address, notes } = req.body;
  try {
    const { data, error } = await supabase
      .from("customers")
      .insert({ business_id, name, phone, email, address, notes })
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

  try {
    const { data, error } = await supabase
      .from("customers")
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
      .from("customers")
      .delete()
      .eq("id", id);

    if (error) return res.json({ success: false, error: error.message });
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

module.exports = router;
