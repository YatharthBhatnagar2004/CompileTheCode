import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Code, Users, Play, ArrowRight, Copy, Check } from "lucide-react";
import api from "../api";

export default function Landing() {
  const navigate = useNavigate();
  const authed = !!localStorage.getItem("token");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);

  const createRoom = async () => {
    setError("");
    if (!authed) {
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/rooms/create");
      if (data?.roomId) {
        navigate(`/room/${data.roomId}`);
      } else {
        setError("Failed to create room");
      }
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-4xl mx-auto"
      >
        {/* Hero Section */}
        <div className="mb-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass mb-8"
          >
            <Code className="w-5 h-5" />
            <span className="text-sm font-medium">Real-time Collaborative Coding</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-5xl md:text-7xl font-bold mb-6"
            style={{ color: 'var(--text-primary)' }}
          >
            Code With Your
            <span className="block bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Friends
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            Real-time collaborative coding with a beautiful glass UI. Write, run, and save code snippets. 
            Invite friends to a shared room to code together.
          </motion.p>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
        >
          <Link 
            to={authed ? "/dashboard" : "/login"} 
            className="btn btn-primary micro-interaction flex items-center gap-3 text-lg px-8 py-4"
          >
            <Play className="w-5 h-5" />
            {authed ? "Go to Dashboard" : "Start Coding Solo"}
            <ArrowRight className="w-5 h-5" />
          </Link>
          
          <button 
            onClick={createRoom} 
            disabled={loading} 
            className="btn btn-secondary micro-interaction flex items-center gap-3 text-lg px-8 py-4"
          >
            <Users className="w-5 h-5" />
            {loading ? "Creating Room..." : "Create Collaboration Room"}
          </button>
        </motion.div>

        {/* Join Room Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="glass-strong rounded-2xl p-8 max-w-2xl mx-auto"
        >
          <h3 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Join a Room
          </h3>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            Have a room code? Enter it below to join an existing collaboration session.
          </p>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300"
            >
              {error}
            </motion.div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter room code (UUID)"
                className="input pr-12"
              />
              {joinCode && (
                <button
                  onClick={copyToClipboard}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
            <button
              onClick={() => {
                if (!joinCode) return;
                if (!authed) { navigate('/login'); return; }
                navigate(`/room/${joinCode}`);
              }}
              className="btn btn-primary micro-interaction flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Join Room
            </button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-20 grid md:grid-cols-3 gap-6"
        >
          <div className="glass rounded-2xl p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-white/10 flex items-center justify-center">
              <Code className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Real-time Editing
            </h4>
            <p style={{ color: 'var(--text-secondary)' }}>
              See changes as they happen with live collaborative editing
            </p>
          </div>
          
          <div className="glass rounded-2xl p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-white/10 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Voice Chat
            </h4>
            <p style={{ color: 'var(--text-secondary)' }}>
              Built-in voice chat for seamless communication
            </p>
          </div>
          
          <div className="glass rounded-2xl p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-white/10 flex items-center justify-center">
              <Play className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Run Code
            </h4>
            <p style={{ color: 'var(--text-secondary)' }}>
              Execute code in multiple languages with instant results
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}


