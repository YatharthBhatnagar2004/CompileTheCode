import React, { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
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
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/10 border border-white/20 shadow-xl backdrop-blur-md" style={{ WebkitBackdropFilter: "blur(12px)" }}>
        <h2 className="text-2xl font-semibold mb-6 text-center">Welcome back</h2>
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
            className="w-full px-4 py-2 rounded-md bg-emerald-500/80 hover:bg-emerald-500 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
        <p className="mt-4 text-sm text-white/80 text-center">
          No account? <Link to="/register" className="underline">Register</Link>
        </p>
      </div>
    </div>
  );
}


