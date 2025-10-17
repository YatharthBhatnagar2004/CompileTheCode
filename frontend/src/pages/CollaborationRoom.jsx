import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { io } from "socket.io-client";
import { motion } from "framer-motion";
import { Users, Mic, MicOff, Phone, PhoneOff, Copy, Save, Play, Code, Volume2, VolumeX, Settings } from "lucide-react";
import api from "../api";
import { toast } from "react-toastify";

export default function CollaborationRoom() {
  const { roomId } = useParams();
  const [users, setUsers] = useState([]);
  const [code, setCode] = useState("// Start collaborating...\n");
  const [language, setLanguage] = useState("javascript");
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState("");
  const socketRef = useRef(null);
  const isApplyingRemoteChange = useRef(false);
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({}); // { socketId: RTCPeerConnection }
  const audioContainerRef = useRef(null);
  const [voiceChatMembers, setVoiceChatMembers] = useState([]); // [{id, username}]
  const [inVoice, setInVoice] = useState(false);

  const username = useMemo(() => {
    try {
      const token = localStorage.getItem("token") || "";
      // lightweight decode of middle part if present, fallback if not
      const payload = token.split(".")[1];
      if (!payload) return "Anonymous";
      const decoded = JSON.parse(atob(payload));
      return decoded.username || "Anonymous";
    } catch {
      return "Anonymous";
    }
  }, []);

  useEffect(() => {
    // Prefer VITE_SOCKET_URL, else derive from VITE_API_URL, else same origin
    const apiBase = import.meta.env.VITE_API_URL;
    let base = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    if (!import.meta.env.VITE_SOCKET_URL && apiBase && apiBase.startsWith("http")) {
      try { const u = new URL(apiBase); base = `${u.protocol}//${u.hostname}${u.port?`:${u.port}`:''}`; } catch {}
    }
    // if frontend served under /, connect to same origin
    const s = io(base, { transports: ["websocket"], autoConnect: true });
    socketRef.current = s;

    s.emit("join-room", { roomId, username });
    console.log("[socket] join-room ->", { roomId, username });

    s.on("room-state", ({ code: c, language: lang, users: us }) => {
      console.log("[socket] room-state <-", { language: lang, users: us?.length });
      if (typeof c === "string") setCode(c);
      if (typeof lang === "string") setLanguage(lang);
      if (Array.isArray(us)) setUsers(us);
    });
    s.on("participants-update", ({ users: us }) => {
      console.log("[socket] participants-update <-", us);
      if (Array.isArray(us)) setUsers(us);
    });

    s.on("user-joined", ({ username: joined }) => {
      console.log("[socket] user-joined <-", joined);
      setUsers((prev) => {
        if (prev.includes(joined)) return prev;
        return [...prev, joined];
      });
    });

    s.on("user-left", ({ username: left }) => {
      console.log("[socket] user-left <-", left);
      setUsers((prev) => prev.filter((u) => u !== left));
    });

    s.on("code-change", ({ code: remoteCode }) => {
      console.log("[socket] code-change <-", remoteCode?.length);
      // prevent echo loop
      isApplyingRemoteChange.current = true;
      setCode(remoteCode);
      // allow next local change to emit again
      setTimeout(() => { isApplyingRemoteChange.current = false; }, 0);
    });

    s.on("language-change", ({ language: lang }) => {
      console.log("[socket] language-change <-", lang);
      setLanguage(lang);
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
      // cleanup RTC
      Object.values(peerConnectionsRef.current).forEach((pc) => {
        try { pc.close(); } catch {}
      });
      peerConnectionsRef.current = {};
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t)=>t.stop());
        localStreamRef.current = null;
      }
    };
  }, [roomId, username]);

  const onEditorChange = (value) => {
    setCode(value);
    if (socketRef.current && !isApplyingRemoteChange.current) {
      console.log("[socket] code-change ->", value?.length);
      socketRef.current.emit("code-change", { roomId, code: value });
    }
  };

  const onLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    if (socketRef.current) {
      socketRef.current.emit("language-change", { roomId, language: lang });
    }
  };

  const runCode = async () => {
    setRunning(true);
    setOutput("");
    try {
      const map = { javascript: "nodejs", python: "python3", cpp: "cpp", java: "java" };
      const { data } = await api.post("/execute", { script: code, language: map[language] || language, versionIndex: "0" });
      setOutput(data.output || data.error || "");
    } catch {
      setOutput("Failed to run code");
    } finally {
      setRunning(false);
    }
  };

  const saveSnippet = async () => {
    try {
      await api.post("/code/save", { title: `Room ${roomId}`, language, code });
    } catch {}
  };

  const inviteLink = typeof window !== "undefined" ? window.location.href : "";

  const copyInvite = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteLink);
      } else {
        // fallback for older browsers
        const ta = document.createElement("textarea");
        ta.value = inviteLink;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      toast.success("Link copied");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Collaboration Room
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Real-time collaborative coding with voice chat
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">{users.length + 1} participants</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-1 space-y-6"
        >
          {/* Room Info */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Room Info
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Invite others to join
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                  Room Link
                </label>
                <div className="flex gap-2">
                  <input 
                    readOnly 
                    value={inviteLink} 
                    className="input text-xs flex-1" 
                  />
                  <button 
                    onClick={copyInvite} 
                    className="btn btn-secondary micro-interaction flex items-center gap-2 px-3"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                </div>
                <div className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Room ID: <span className="font-mono">{roomId}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Voice Chat */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Voice Chat
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {inVoice ? "Connected" : "Not connected"}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              {!inVoice ? (
                <button
                  onClick={async () => {
                    try {
                      if (!localStreamRef.current) {
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        localStreamRef.current = stream;
                        console.log("[voice] got local stream", stream.getTracks().map(t => t.kind));
                      }
                      socketRef.current.emit("join-voice-room", { roomId });
                      console.log("[voice] join-voice-room ->", roomId);
                      // existing users
                      socketRef.current.off("all-users");
                      socketRef.current.on("all-users", async (users) => {
                        console.log("[voice] all-users <-", users);
                        setVoiceChatMembers(users);
                        for (const userId of users) {
                          await createPeerInternal(userId.id || userId, socketRef.current, localStreamRef.current, peerConnectionsRef, audioContainerRef.current);
                        }
                        setInVoice(true);
                      });
                      // someone joined and sent us an offer
                      socketRef.current.off("user-joined");
                      socketRef.current.on("user-joined", async ({ signal, callerID, username: uname }) => {
                        console.log("[voice] user-joined <-", { callerID, uname });
                        setVoiceChatMembers((prev) => {
                          if (prev.find(p => p.id === callerID)) return prev;
                          return [...prev, { id: callerID, username: uname || "Anonymous" }];
                        });
                        await acceptPeerInternal(callerID, signal, socketRef.current, localStreamRef.current, peerConnectionsRef, audioContainerRef.current);
                      });
                      // our offer got answered
                      socketRef.current.off("receiving-returned-signal");
                      socketRef.current.on("receiving-returned-signal", async ({ signal, id }) => {
                        console.log("[voice] receiving-returned-signal <-", id);
                        const pc = peerConnectionsRef.current[id];
                        if (pc) {
                          await pc.setRemoteDescription(new RTCSessionDescription(signal));
                        }
                      });
                      // ICE candidates
                      socketRef.current.off("ice-candidate");
                      socketRef.current.on("ice-candidate", async ({ candidate, from }) => {
                        const pc = peerConnectionsRef.current[from];
                        if (pc && candidate) {
                          try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) { console.log("[voice] addIceCandidate error", e); }
                        }
                      });
                      socketRef.current.off("user-left-voice");
                      socketRef.current.on("user-left-voice", ({ id, username: uname }) => {
                        console.log("[voice] user-left-voice <-", id);
                        const pc = peerConnectionsRef.current[id];
                        if (pc) { try { pc.close(); } catch {} delete peerConnectionsRef.current[id]; }
                        setVoiceChatMembers((prev) => prev.filter(p => p.id !== id));
                        toast.info(`${uname || 'A user'} has left the voice chat.`);
                      });
                      toast.success("Joined voice chat");
                    } catch (e) {
                      toast.error("Failed to join voice");
                    }
                  }}
                  className="btn btn-primary w-full micro-interaction flex items-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  Join Voice Chat
                </button>
              ) : (
                <button
                  onClick={() => {
                    // leave voice
                    try {
                      socketRef.current.emit("leave-voice-room", { roomId });
                      console.log("[voice] leave-voice-room ->", roomId);
                    } catch {}
                    Object.entries(peerConnectionsRef.current).forEach(([id, pc]) => { try { pc.close(); } catch {} });
                    peerConnectionsRef.current = {};
                    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null; }
                    setVoiceChatMembers([]);
                    setInVoice(false);
                  }}
                  className="btn btn-secondary w-full micro-interaction flex items-center gap-2"
                >
                  <MicOff className="w-4 h-4" />
                  Leave Voice
                </button>
              )}
              
              <div ref={audioContainerRef} className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}></div>
            </div>
          </div>

          {/* Participants */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Participants
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {users.length + 1} online
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              {[username, ...users.filter((u) => u !== username)].map((u, idx) => (
                <div key={u + idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-xs font-medium">{u.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{u}</span>
                  {u === username && (
                    <span className="text-xs px-2 py-1 rounded-full bg-white/10" style={{ color: 'var(--text-secondary)' }}>
                      You
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.aside>

        {/* Main Editor */}
        <motion.main
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-3 space-y-6"
        >
          {/* Editor Controls */}
          <div className="glass rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <select 
                  value={language} 
                  onChange={onLanguageChange} 
                  className="select"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={saveSnippet} 
                  className="btn btn-secondary micro-interaction flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button 
                  onClick={runCode} 
                  disabled={running} 
                  className="btn btn-primary micro-interaction flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  {running ? "Running..." : "Run"}
                </button>
              </div>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="glass rounded-2xl p-6">
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              <Editor 
                height="50vh" 
                language={language} 
                theme="vs-dark" 
                value={code} 
                onChange={onEditorChange} 
                options={{ 
                  automaticLayout: true,
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on'
                }} 
              />
            </div>
          </div>

          {/* Output Panel */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Output
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Code execution results
                </p>
              </div>
            </div>
            
            <div className="bg-black/20 rounded-lg p-4 min-h-[150px]">
              <pre className="whitespace-pre-wrap text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
                {output || "Run your code to see output here..."}
              </pre>
            </div>
          </div>
        </motion.main>
      </div>
    </div>
  );
}

// Helpers
async function addTracks(pc, stream) {
  for (const track of stream.getTracks()) {
    pc.addTrack(track, stream);
  }
}

async function createPeerInternal(targetId, socket, localStream, peersRef, audioContainer) {
  const pc = new RTCPeerConnection({ iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ] });
  await addTracks(pc, localStream);

  pc.onicecandidate = (e) => {
    if (e.candidate) {
      console.log("[voice] onicecandidate ->", targetId);
      socket.emit("ice-candidate", { target: targetId, candidate: e.candidate });
    }
  };

  pc.ontrack = (e) => {
    console.log("[voice] ontrack from", targetId);
    const el = document.createElement("audio");
    el.autoplay = true;
    el.playsInline = true;
    el.srcObject = e.streams[0];
    audioContainer?.appendChild(el);
  };

  pc.onconnectionstatechange = () => {
    console.log("[voice] peer", targetId, "state:", pc.connectionState);
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  peersRef.current[targetId] = pc;
  console.log("[voice] sending-signal ->", { targetId });
  socket.emit("sending-signal", { userToSignal: targetId, callerID: socket.id, signal: offer });
}

async function acceptPeerInternal(callerID, signal, socket, localStream, peersRef, audioContainer) {
  const pc = new RTCPeerConnection({ iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ] });
  await addTracks(pc, localStream);

  pc.onicecandidate = (e) => {
    if (e.candidate) {
      console.log("[voice] onicecandidate (answer) ->", callerID);
      socket.emit("ice-candidate", { target: callerID, candidate: e.candidate });
    }
  };

  pc.ontrack = (e) => {
    console.log("[voice] ontrack from", callerID);
    const el = document.createElement("audio");
    el.autoplay = true;
    el.playsInline = true;
    el.srcObject = e.streams[0];
    audioContainer?.appendChild(el);
  };

  pc.onconnectionstatechange = () => {
    console.log("[voice] peer", callerID, "state:", pc.connectionState);
  };

  await pc.setRemoteDescription(new RTCSessionDescription(signal));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  peersRef.current[callerID] = pc;
  console.log("[voice] returning-signal ->", { callerID });
  socket.emit("returning-signal", { callerID, signal: answer });
}




