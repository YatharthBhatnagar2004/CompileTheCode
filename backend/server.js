const express = require("express");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
const allowedOrigin = process.env.FRONTEND_URL || true; // set to specific URL in production
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://yatharth:123qaz123@cluster1.bthk3na.mongodb.net/code-saver-db";
mongoose
  .connect(MONGODB_URI, { dbName: "code-saver-db" })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error", err);
    process.exit(1);
  });

// Routes
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Auth and Code routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/code", require("./routes/code"));

// Optional: keep JDoodle proxy for future use
app.post("/api/execute", async (req, res) => {
  const { script, language, versionIndex } = req.body;
  const clientId = process.env.JDOODLE_CLIENT_ID;
  const clientSecret = process.env.JDOODLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(501).json({
      error: "Execution not configured",
      detail: "Missing JDOODLE_CLIENT_ID or JDOODLE_CLIENT_SECRET in backend .env",
    });
  }
  try {
    const response = await axios.post("https://api.jdoodle.com/v1/execute", {
      clientId,
      clientSecret,
      script,
      language,
      versionIndex: versionIndex || "0",
    });
    res.json(response.data);
  } catch (error) {
    const status = error?.response?.status || 500;
    const data = error?.response?.data || {};
    res.status(status).json({ error: "Failed to execute code", provider: data });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
