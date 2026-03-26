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

// POST /api/enterprise/apply
router.post("/apply", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("enterprise_applications")
      .insert({ ...req.body })
      .select()
      .single();

    if (error) return res.json({ success: false, error: error.message });

    const businessName = req.body.business_name || "Unknown";
    await sendSMS(
      ADMIN_PHONE,
      `New CommandField Enterprise application from ${businessName}. Check admin portal.`
    );

    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

module.exports = router;
