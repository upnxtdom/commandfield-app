const { Router } = require("express");
const supabase = require("../lib/supabase");
const twilio = require("../lib/twilio");

const router = Router();

const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const ADMIN_PHONE = process.env.TWILIO_PHONE_NUMBER;

async function sendSMS(to, body) {
  try {
    await twilio.messages.create({ from: FROM_NUMBER, to, body });
  } catch (err) {
    console.error("SMS send error:", err.message);
  }
}

// POST /api/onboarding/business
router.post("/business", async (req, res) => {
  const { user_id, business_name, vertical, phone, address, timezone, logo_url } = req.body;
  try {
    const { data, error } = await supabase
      .from("businesses")
      .update({ business_name, vertical, phone, address, timezone, logo_url })
      .eq("owner_id", user_id)
      .select()
      .single();

    if (error) return res.json({ success: false, error: error.message });
    return res.json({ success: true, data });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

// POST /api/onboarding/workers
router.post("/workers", async (req, res) => {
  const { business_id, workers } = req.body;
  if (!business_id || !Array.isArray(workers)) {
    return res.json({ success: false, error: "business_id and workers array are required." });
  }

  try {
    const { data: business } = await supabase
      .from("businesses")
      .select("business_name")
      .eq("id", business_id)
      .single();

    const businessName = business?.business_name || "Your company";

    const rows = workers.map((w) => ({
      business_id,
      name: w.name,
      phone: w.phone,
      email: w.email,
      role: w.role,
      status: "active",
    }));

    const { data, error } = await supabase.from("workers").insert(rows).select();

    if (error) return res.json({ success: false, error: error.message });

    await Promise.all(
      (data || []).map((w) =>
        w.phone
          ? sendSMS(
              w.phone,
              `Hey ${w.name}, ${businessName} just set you up on CommandField. You'll receive job assignments here. Reply START to activate your account.`
            )
          : Promise.resolve()
      )
    );

    return res.json({ success: true, data });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

// POST /api/onboarding/assign-number
router.post("/assign-number", async (req, res) => {
  const { business_id, owner_phone } = req.body;
  try {
    const { data: business } = await supabase
      .from("businesses")
      .select("owner_id")
      .eq("id", business_id)
      .single();

    if (!business?.owner_id) {
      return res.json({ success: false, error: "Business or owner not found." });
    }

    const { error } = await supabase
      .from("profiles")
      .update({ phone: owner_phone })
      .eq("id", business.owner_id);

    if (error) return res.json({ success: false, error: error.message });

    await sendSMS(
      owner_phone,
      "CommandField is connected. Text 'jobs today' to test your command line. Reply HELP anytime for available commands."
    );

    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

// GET /api/onboarding/status/:business_id
router.get("/status/:business_id", async (req, res) => {
  const { business_id } = req.params;
  try {
    const [{ data: business }, { count: workerCount }, { data: ownerProfile }] = await Promise.all([
      supabase.from("businesses").select("business_name, vertical, owner_id").eq("id", business_id).single(),
      supabase.from("workers").select("*", { count: "exact", head: true }).eq("business_id", business_id),
      supabase
        .from("businesses")
        .select("owner_id")
        .eq("id", business_id)
        .single()
        .then(async ({ data: b }) => {
          if (!b?.owner_id) return { data: null };
          return supabase.from("profiles").select("phone").eq("id", b.owner_id).single();
        }),
    ]);

    const business_profile = !!(business?.business_name && business?.vertical);
    const workers_added = (workerCount || 0) >= 1;
    const number_connected = !!(ownerProfile?.phone);
    const onboarding_complete = business_profile && workers_added && number_connected;

    return res.json({
      success: true,
      data: { business_profile, workers_added, number_connected, onboarding_complete },
    });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

module.exports = router;
