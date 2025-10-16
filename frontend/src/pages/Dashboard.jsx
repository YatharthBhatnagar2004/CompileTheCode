import React, { useState } from "react";
import Editor from "@monaco-editor/react";
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
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md" style={{ WebkitBackdropFilter: "blur(12px)" }}>
          <div className="flex gap-3 mb-3">
            <input
              className="flex-1 px-3 py-2 rounded-md bg-white/20 border border-white/30 placeholder-white/70 focus:outline-none"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <select
              className="px-3 py-2 rounded-md bg-white/20 border border-white/30 focus:outline-none glass-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>
            <button
              onClick={saveSnippet}
              disabled={saving}
              className="px-4 py-2 rounded-md bg-green-500/80 hover:bg-green-500 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={runCode}
              disabled={running}
              className="px-4 py-2 rounded-md bg-blue-500/80 hover:bg-blue-500 disabled:opacity-60"
            >
              {running ? "Running..." : "Run Code"}
            </button>
          </div>
          <Editor height="420px" language={language} theme="vs-dark" value={code} onChange={(v)=>setCode(v)} options={{ automaticLayout: true }} />
        </div>
        {message && <div className="text-sm text-white/80">{message}</div>}
      </div>
      <div className="p-4 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md" style={{ WebkitBackdropFilter: "blur(12px)" }}>
        <h3 className="text-lg font-semibold mb-2">Output</h3>
        <pre className="whitespace-pre-wrap text-white/90 min-h-[200px]">{output}</pre>
      </div>
    </div>
  );
}


