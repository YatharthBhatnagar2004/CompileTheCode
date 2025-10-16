const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();
const port = 5000;

//requiring environment variables
require("dotenv").config();

const snippets = {};
let snippetCounter = 1;

app.use(cors());
app.use(express.json());

// Proxy JDoodle API request to avoid CORS
app.post("/api/execute", async (req, res) => {
  const { script, language, versionIndex } = req.body;
  try {
    const response = await axios.post("https://api.jdoodle.com/v1/execute", {
      clientId: process.env.JDOODLE_CLIENT_ID,
      clientSecret: process.env.JDOODLE_CLIENT_SECRET,
      script,
      language,
      versionIndex: versionIndex || "0",
    });
    res.json(response.data);
  } catch (error) { 
    res.status(500).json({ error: "Failed to execute code" });
  }
});

// Save a code snippet
app.post("/api/snippets", (req, res) => {
  const { code, language } = req.body;
  const id = snippetCounter++;
  snippets[id] = { code, language };
  res.json({ id });
});

// Load a code snippet by ID
app.get("/api/snippets/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const snippet = snippets[id];
  if (snippet) {
    res.json(snippet);
  } else {
    res.status(404).json({ error: "Snippet not found" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
