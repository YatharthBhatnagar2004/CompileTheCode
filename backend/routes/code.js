const router = require("express").Router();
const CodeSnippet = require("../models/CodeSnippet");
const auth = require("../middleware/auth");

// POST /api/code/save
router.post("/save", auth, async (req, res) => {
  try {
    const { title, language, code } = req.body;
    if (!code) return res.status(400).json({ error: "Code is required" });
    const snippet = await CodeSnippet.create({
      title: title || "Untitled",
      language: language || "javascript",
      code,
      user: req.userId,
    });
    return res.status(201).json(snippet);
  } catch (err) {
    return res.status(500).json({ error: "Failed to save snippet" });
  }
});

// GET /api/code/my-snippets
router.get("/my-snippets", auth, async (req, res) => {
  try {
    const snippets = await CodeSnippet.find({ user: req.userId }).sort({ createdAt: -1 });
    return res.json(snippets);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch snippets" });
  }
});

// GET /api/code/snippet/:id
router.get("/snippet/:id", auth, async (req, res) => {
  try {
    const snippet = await CodeSnippet.findOne({ _id: req.params.id, user: req.userId });
    if (!snippet) return res.status(404).json({ error: "Snippet not found" });
    return res.json(snippet);
  } catch (err) {
    return res.status(404).json({ error: "Snippet not found" });
  }
});

// PUT /api/code/snippet/:id -> update title/language/code
router.put("/snippet/:id", auth, async (req, res) => {
  try {
    const { title, language, code } = req.body;
    const update = {};
    if (typeof title === "string") update.title = title;
    if (typeof language === "string") update.language = language;
    if (typeof code === "string") update.code = code;

    const snippet = await CodeSnippet.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { $set: update },
      { new: true }
    );
    if (!snippet) return res.status(404).json({ error: "Snippet not found" });
    return res.json(snippet);
  } catch (err) {
    return res.status(400).json({ error: "Failed to update snippet" });
  }
});

module.exports = router;


