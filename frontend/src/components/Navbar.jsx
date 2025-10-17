import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Code, LayoutDashboard, FileText, LogIn, UserPlus, LogOut } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-4 z-50 mx-4 mb-8"
    >
      <div className="glass-strong rounded-2xl px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-3 text-xl font-bold text-white hover:text-white/80 transition-colors micro-interaction"
          >
            <Code className="w-6 h-6" />
            CodeSaver
          </Link>
          
          <div className="flex items-center gap-2">
            {token ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="btn btn-ghost micro-interaction flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link 
                  to="/my-snippets" 
                  className="btn btn-ghost micro-interaction flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  My Snippets
                </Link>
                <button
                  onClick={logout}
                  className="btn btn-secondary micro-interaction flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="btn btn-ghost micro-interaction flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="btn btn-primary micro-interaction flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}


