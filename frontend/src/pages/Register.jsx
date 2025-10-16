import React, { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register", { email, password });
      navigate("/login");
    } catch (err) {
      setError(err?.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/10 border border-white/20 shadow-xl backdrop-blur-md" style={{ WebkitBackdropFilter: "blur(12px)" }}>
        <h2 className="text-2xl font-semibold mb-6 text-center">Create an account</h2>
        {error && <div className="mb-4 text-red-300">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-md bg-white/20 border border-white/30 placeholder-white/70 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-md bg-white/20 border border-white/30 placeholder-white/70 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-md bg-blue-500/80 hover:bg-blue-500 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Register"}
          </button>
        </form>
        <p className="mt-4 text-sm text-white/80 text-center">
          Already have an account? <Link to="/login" className="underline">Login</Link>
        </p>
      </div>
    </div>
  );
}


