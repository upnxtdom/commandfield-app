require("dotenv").config();

const express = require("express");
const cors = require("cors");

const supabase = require("./lib/supabase");
const stripe = require("./lib/stripe");
const twilio = require("./lib/twilio");

const authRouter = require("./routes/auth");
const workersRouter = require("./routes/workers");
const customersRouter = require("./routes/customers");
const jobsRouter = require("./routes/jobs");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "commandfield-api" });
});

app.use("/api/auth", authRouter);
app.use("/api/workers", workersRouter);
app.use("/api/customers", customersRouter);
app.use("/api/jobs", jobsRouter);

app.listen(PORT, () => {
  console.log("CommandField API running on port 3000");
});
