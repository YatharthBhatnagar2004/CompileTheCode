import React from "react";
import { motion } from "framer-motion";
import { Heart, Github, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mt-16 py-8"
    >
      <div className="container mx-auto px-4">
        <div className="glass rounded-2xl p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span>Built with</span>
              <Heart className="w-4 h-4 text-red-400" />
              <span>using MERN, Monaco, and Socket.IO</span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Collaborate in real time
              </span>
              <div className="flex gap-3">
                <a 
                  href="#" 
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors micro-interaction"
                  aria-label="GitHub"
                >
                  <Github className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                </a>
                <a 
                  href="#" 
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors micro-interaction"
                  aria-label="Twitter"
                >
                  <Twitter className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}


