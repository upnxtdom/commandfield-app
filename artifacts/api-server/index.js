require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "commandfield-api" });
});

app.listen(PORT, () => {
  console.log("CommandField API running on port 3000");
});
