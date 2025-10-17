const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const auth = require("../middleware/auth");

// POST /api/rooms/create
router.post("/create", auth, async (req, res) => {
  try {
    const roomId = uuidv4();
    return res.status(201).json({ roomId });
  } catch (err) {
    return res.status(500).json({ error: "Failed to create room" });
  }
});

module.exports = router;


