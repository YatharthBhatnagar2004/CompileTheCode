const router = require("express").Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "User already exists" });

    const user = await User.create({ email, password });
    return res.status(201).json({ id: user._id, email: user.email });
  } catch (err) {
    return res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "dev_secret", { expiresIn: "7d" });
    return res.json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    return res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;


