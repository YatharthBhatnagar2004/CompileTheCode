const express = require("express");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
// Allow all origins (no credentials). For credentialed requests, configure a specific origin instead.
app.use(cors({ origin: "*", credentials: false }));
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

// Auth, Code and Rooms routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/code", require("./routes/code"));
app.use("/api/rooms", require("./routes/rooms"));

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

const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Socket.IO setup
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "*",
    credentials: false,
  },
});

const socketIdToUser = new Map();
// In-memory room state: { [roomId]: { code: string, language: string, users: Set<string> } }
const roomStates = new Map();

io.on("connection", (socket) => {
  // client should emit: join-room { roomId, username }
  socket.on("join-room", ({ roomId, username }) => {
    if (!roomId) return;
    socket.join(roomId);
    socketIdToUser.set(socket.id, { roomId, username });

    // Track users in room
    const current = roomStates.get(roomId) || { code: "// Start collaborating...\n", language: "javascript", users: new Set() };
    current.users.add(username || "Anonymous");
    roomStates.set(roomId, current);

    // Send current state to the newly joined client
    socket.emit("room-state", { code: current.code, language: current.language, users: Array.from(current.users) });

    // Notify others
    socket.to(roomId).emit("user-joined", { username });
    // Broadcast participants snapshot to all room members (including self)
    io.to(roomId).emit("participants-update", { users: Array.from(current.users) });
  });

  // relay code changes to others in the same room
  socket.on("code-change", ({ roomId, code }) => {
    if (!roomId) return;
    // Update state
    const current = roomStates.get(roomId) || { code: "", language: "javascript", users: new Set() };
    current.code = typeof code === "string" ? code : current.code;
    roomStates.set(roomId, current);
    // Broadcast to others
    socket.to(roomId).emit("code-change", { code });
  });

  // handle language changes
  socket.on("language-change", ({ roomId, language }) => {
    if (!roomId || typeof language !== "string") return;
    const current = roomStates.get(roomId) || { code: "", language: "javascript", users: new Set() };
    current.language = language;
    roomStates.set(roomId, current);
    socket.to(roomId).emit("language-change", { language });
  });

  socket.on("disconnect", () => {
    const info = socketIdToUser.get(socket.id);
    if (info && info.roomId) {
      // Update room users set
      const rs = roomStates.get(info.roomId);
      if (rs && rs.users) {
        rs.users.delete(info.username);
        roomStates.set(info.roomId, rs);
      }
      socket.to(info.roomId).emit("user-left", { username: info.username });
      // notify full participants list
      const updated = roomStates.get(info.roomId);
      if (updated) io.to(info.roomId).emit("participants-update", { users: Array.from(updated.users) });
      // also notify voice room if user was connected
      socket.to(`${info.roomId}-voice`).emit("user-left-voice", { id: socket.id, username: info.username || "Anonymous" });
    }
    socketIdToUser.delete(socket.id);
  });

  // ========== WebRTC signaling for Voice Chat ==========
  // Users join a separate voice room (same roomId) but we track participants by socket id
  socket.on("join-voice-room", ({ roomId }) => {
    if (!roomId) return;
    socket.join(`${roomId}-voice`);
    const userInfo = socketIdToUser.get(socket.id) || {};
    console.log("[voice] join-voice-room", { roomId, socket: socket.id, username: userInfo.username });
    // Get list of other users in voice room (exclude self)
    const voiceRoom = io.sockets.adapter.rooms.get(`${roomId}-voice`) || new Set();
    const otherUsers = Array.from(voiceRoom)
      .filter((id) => id !== socket.id)
      .map((id) => ({ id, username: (socketIdToUser.get(id) || {}).username || "Anonymous" }));
    // Send only to the joining user
    socket.emit("all-users", otherUsers);
  });

  socket.on("sending-signal", ({ userToSignal, callerID, signal }) => {
    if (!userToSignal || !callerID || !signal) return;
    const callerInfo = socketIdToUser.get(callerID) || {};
    console.log("[voice] sending-signal", { to: userToSignal, from: callerID, username: callerInfo.username });
    io.to(userToSignal).emit("user-joined", { signal, callerID, username: callerInfo.username || "Anonymous" });
  });

  socket.on("returning-signal", ({ callerID, signal }) => {
    if (!callerID || !signal) return;
    const selfInfo = socketIdToUser.get(socket.id) || {};
    console.log("[voice] returning-signal", { to: callerID, from: socket.id, username: selfInfo.username });
    io.to(callerID).emit("receiving-returned-signal", { signal, id: socket.id, username: selfInfo.username || "Anonymous" });
  });

  socket.on("leave-voice-room", ({ roomId }) => {
    if (!roomId) return;
    const info = socketIdToUser.get(socket.id) || {};
    console.log("[voice] leave-voice-room", { roomId, socket: socket.id, username: info.username });
    socket.leave(`${roomId}-voice`);
    socket.to(`${roomId}-voice`).emit("user-left-voice", { id: socket.id, username: info.username || "Anonymous" });
  });

  socket.on("ice-candidate", ({ target, candidate }) => {
    if (!target || !candidate) return;
    console.log("[voice] ice-candidate relay", { from: socket.id, to: target });
    io.to(target).emit("ice-candidate", { candidate, from: socket.id });
  });
});
