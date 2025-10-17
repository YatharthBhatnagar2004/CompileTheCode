import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import { motion } from "framer-motion";
import { Save, Play, FileText, Terminal, Code, Settings, Download } from "lucide-react";
import api from "../api";

export default function Dashboard() {
  const [title, setTitle] = useState(localStorage.getItem("draft_title") || "");
  const [language, setLanguage] = useState(localStorage.getItem("draft_language") || "javascript");
  const [code, setCode] = useState(localStorage.getItem("draft_code") || "// Start coding...\n");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState("");

  const languageToJdoodle = (lang) => {
    switch (lang) {
      case "javascript":
        return "nodejs";
      case "python":
        return "python3";
      case "cpp":
        return "cpp";
      case "java":
        return "java";
      default:
        return "nodejs";
    }
  };

  const saveSnippet = async () => {
    setSaving(true);
    setMessage("");
    try {
      const { data } = await api.post("/code/save", { title, language, code });
      setMessage(`Saved: ${data.title}`);
    } catch (err) {
      setMessage(err?.response?.data?.error || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const runCode = async () => {
    setRunning(true);
    setOutput("");
    try {
      const jdLang = languageToJdoodle(language);
      const { data } = await api.post("/execute", {
        script: code,
        language: jdLang,
        versionIndex: "0",
      });
      setOutput(data.output || data.error || "");
    } catch (err) {
      setOutput("Failed to run code");
    } finally {
      setRunning(false);
    }
  };

  // Persist draft to localStorage to survive refreshes
  React.useEffect(() => {
    localStorage.setItem("draft_title", title);
  }, [title]);
  React.useEffect(() => {
    localStorage.setItem("draft_language", language);
  }, [language]);
  React.useEffect(() => {
    if (typeof code === "string") localStorage.setItem("draft_code", code);
  }, [code]);

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
            Code Editor
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Write, run, and save your code snippets
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
            <Code className="w-4 h-4" />
            <span className="text-sm font-medium">{language.toUpperCase()}</span>
          </div>
        </div>
      </motion.div>

      {/* Bento Grid Layout */}
      <div className="bento-grid">
        {/* Main Editor - Large */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bento-item bento-item-large"
        >
          <div className="space-y-4">
            {/* Editor Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  className="input"
                  placeholder="Enter snippet title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <select
                className="select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={saveSnippet}
                disabled={saving}
                className="btn btn-primary micro-interaction flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Snippet"}
              </button>
              <button
                onClick={runCode}
                disabled={running}
                className="btn btn-secondary micro-interaction flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                {running ? "Running..." : "Run Code"}
              </button>
            </div>

            {/* Monaco Editor */}
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              <Editor 
                height="400px" 
                language={language} 
                theme="vs-dark" 
                value={code} 
                onChange={(v) => setCode(v)} 
                options={{ 
                  automaticLayout: true,
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on'
                }} 
              />
            </div>

            {/* Status Message */}
            {message && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-300 flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                {message}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Output Panel - Medium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bento-item bento-item-medium"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Terminal className="w-5 h-5" />
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
            
            <div className="bg-black/20 rounded-lg p-4 min-h-[200px]">
              <pre className="whitespace-pre-wrap text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
                {output || "Run your code to see output here..."}
              </pre>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions - Small */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bento-item bento-item-small"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Quick Actions
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Common tasks
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <button className="w-full btn btn-ghost micro-interaction flex items-center gap-3 justify-start">
                <FileText className="w-4 h-4" />
                View My Snippets
              </button>
              <button className="w-full btn btn-ghost micro-interaction flex items-center gap-3 justify-start">
                <Download className="w-4 h-4" />
                Export Code
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


