import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur-md bg-white/10 border-b border-white/20 shadow-lg"
      style={{ WebkitBackdropFilter: "blur(12px)" }}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-bold text-xl">CodeSaver</Link>
        <div className="flex items-center gap-4">
          {token ? (
            <>
              <Link to="/dashboard" className="hover:underline">Dashboard</Link>
              <Link to="/my-snippets" className="hover:underline">My Snippets</Link>
              <button
                onClick={logout}
                className="px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 border border-white/30"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:underline">Login</Link>
              <Link to="/register" className="hover:underline">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}


