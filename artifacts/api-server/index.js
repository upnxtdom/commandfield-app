require("dotenv").config();

const express = require("express");
const cors = require("cors");

const supabase = require("./lib/supabase");
const stripe = require("./lib/stripe");
const twilio = require("./lib/twilio");
const { requireAuth } = require("./lib/middleware/auth");

const authRouter = require("./routes/auth");
const workersRouter = require("./routes/workers");
const customersRouter = require("./routes/customers");
const jobsRouter = require("./routes/jobs");
const invoicesRouter = require("./routes/invoices");
const kpiRouter = require("./routes/kpi");
const dispatchRouter = require("./routes/dispatch");
const webhooksRouter = require("./routes/webhooks");
const onboardingRouter = require("./routes/onboarding");
const enterpriseRouter = require("./routes/enterprise");

const app = express();
const PORT = 3000;

// Body parsing
app.use(cors());
app.use("/api/webhooks/stripe", express.raw({ type: "application/json" }));
app.use(express.json());

// ─── PUBLIC ROUTES (mounted before auth middleware) ───────────────────────────

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "commandfield-api" });
});

// ─── GLOBAL AUTH MIDDLEWARE ───────────────────────────────────────────────────
// Bypasses auth for the specific public POST paths listed below.
// All other routes require a valid Bearer token.

const PUBLIC_PATHS = [
  { method: "POST", path: "/api/auth/login" },
  { method: "POST", path: "/api/auth/register" },
  { method: "POST", path: "/api/webhooks/stripe" },
  { method: "POST", path: "/api/enterprise/apply" },
];

app.use((req, res, next) => {
  const isPublic = PUBLIC_PATHS.some(
    (p) => p.method === req.method && p.path === req.path
  );
  if (isPublic) return next();
  return requireAuth(req, res, next);
});

// ─── PROTECTED ROUTES ─────────────────────────────────────────────────────────

app.use("/api/auth", authRouter);
app.use("/api/workers", workersRouter);
app.use("/api/customers", customersRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/kpi", kpiRouter);
app.use("/api/dispatch", dispatchRouter);
app.use("/api/webhooks", webhooksRouter);
app.use("/api/onboarding", onboardingRouter);
app.use("/api/enterprise", enterpriseRouter);

app.listen(PORT, () => {
  console.log("CommandField API running on port 3000");
});
