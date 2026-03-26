const { Router } = require("express");
const supabase = require("../lib/supabase");
const stripe = require("../lib/stripe");
const twilio = require("../lib/twilio");

const router = Router();

const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;

function generatePassword(length = 8) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function sendSMS(to, body) {
  try {
    await twilio.messages.create({ from: FROM_NUMBER, to, body });
  } catch (err) {
    console.error("SMS send error:", err.message);
  }
}

router.post("/stripe", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const email = session.customer_details?.email || session.metadata?.email;
        const stripe_customer_id = session.customer;
        const plan = session.metadata?.plan || "standard";
        const billing_cycle = session.metadata?.billing_cycle || "monthly";
        const phone = session.metadata?.phone;

        let { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("email", email)
          .single();

        if (!profile) {
          const { data: newProfile } = await supabase
            .from("profiles")
            .insert({ email, role: "owner" })
            .select()
            .single();
          profile = newProfile;
        }

        const businessInsert = {
          stripe_customer_id,
          plan,
          billing_cycle,
          subscription_status: "active",
          owner_id: profile?.id,
        };
        if (plan === "pro") businessInsert.dispatch_seats = 3;

        await supabase.from("businesses").insert(businessInsert);

        await supabase.rpc("increment_founding_spots");

        if (phone) {
          const tempPassword = generatePassword();
          await sendSMS(
            phone,
            `Welcome to CommandField! Your account is ready. Log in at commandfield.com/dashboard Your temp password: ${tempPassword} Change it on first login.`
          );
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        await supabase
          .from("businesses")
          .update({ subscription_status: "active" })
          .eq("stripe_customer_id", invoice.customer);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        await supabase
          .from("businesses")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", invoice.customer);

        const { data: business } = await supabase
          .from("businesses")
          .select("owner_id")
          .eq("stripe_customer_id", invoice.customer)
          .single();

        if (business?.owner_id) {
          const { data: owner } = await supabase
            .from("profiles")
            .select("phone")
            .eq("id", business.owner_id)
            .single();
          if (owner?.phone) {
            await sendSMS(
              owner.phone,
              "CommandField: Your payment failed. Please update billing at commandfield.com/billing to keep your account active."
            );
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await supabase
          .from("businesses")
          .update({ subscription_status: "cancelled" })
          .eq("stripe_customer_id", subscription.customer);

        const { data: business } = await supabase
          .from("businesses")
          .select("owner_id")
          .eq("stripe_customer_id", subscription.customer)
          .single();

        if (business?.owner_id) {
          const { data: owner } = await supabase
            .from("profiles")
            .select("phone")
            .eq("id", business.owner_id)
            .single();
          if (owner?.phone) {
            await sendSMS(
              owner.phone,
              "Your CommandField subscription has been cancelled. Questions? Text or call hello@commandfield.com"
            );
          }
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err.message);
  }

  return res.json({ received: true });
});

module.exports = router;
