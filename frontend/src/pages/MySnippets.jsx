import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, FileText, Calendar, Code, Plus, Filter, SortAsc } from "lucide-react";
import api from "../api";

export default function MySnippets() {
  const [snippets, setSnippets] = useState([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/code/my-snippets");
        setSnippets(data);
      } catch (err) {
        setError(err?.response?.data?.error || "Failed to load snippets");
      }
    })();
  }, []);

  const filtered = snippets.filter((s) => (s.title || "").toLowerCase().includes(query.toLowerCase()));

  const sortedSnippets = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "oldest":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "title":
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const getLanguageColor = (lang) => {
    const colors = {
      javascript: "text-yellow-400",
      python: "text-green-400",
      cpp: "text-blue-400",
      java: "text-orange-400"
    };
    return colors[lang] || "text-gray-400";
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
            My Snippets
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage and organize your code snippets
          </p>
        </div>
        <Link
          to="/dashboard"
          className="btn btn-primary micro-interaction flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Snippet
        </Link>
      </motion.div>

      {/* Search and Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search snippets by title..."
              className="input pl-12"
            />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="select pl-10"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Alphabetical</option>
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 flex items-center gap-2"
        >
          <div className="w-2 h-2 rounded-full bg-red-400"></div>
          {error}
        </motion.div>
      )}

      {/* Snippets Grid */}
      {sortedSnippets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass rounded-2xl p-12 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 flex items-center justify-center">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            No snippets found
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            {query ? "Try adjusting your search terms" : "Start creating your first code snippet"}
          </p>
        </motion.div>
      ) : (
        <div className="bento-grid">
          {sortedSnippets.map((snippet, index) => (
            <motion.div
              key={snippet._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
              className="bento-item micro-interaction"
            >
              <Link to={`/editor/${snippet._id}`} className="block h-full">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {snippet.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <Code className="w-4 h-4" />
                        <span className={getLanguageColor(snippet.language)}>
                          {snippet.language.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(snippet.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Preview */}
                  <div className="bg-black/20 rounded-lg p-3">
                    <pre className="text-xs font-mono whitespace-pre-wrap overflow-hidden" style={{ color: 'var(--text-secondary)' }}>
                      {snippet.code?.substring(0, 100)}
                      {snippet.code?.length > 100 && "..."}
                    </pre>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}


