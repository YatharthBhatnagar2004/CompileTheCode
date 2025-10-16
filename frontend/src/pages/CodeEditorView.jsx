import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import api from "../api";

export default function CodeEditorView() {
  const { snippetId } = useParams();
  const [snippet, setSnippet] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/code/snippet/${snippetId}`);
        setSnippet(data);
        setTitle(data.title || "");
        setLanguage(data.language || "javascript");
        setCode(data.code || "");
      } catch (err) {
        setError(err?.response?.data?.error || "Failed to load snippet");
      } finally {
        setLoading(false);
      }
    })();
  }, [snippetId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-300">{error}</div>;
  if (!snippet) return null;

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md" style={{ WebkitBackdropFilter: "blur(12px)" }}>
        <div className="flex gap-3 mb-3">
          <input
            className="flex-1 px-3 py-2 rounded-md bg-white/20 border border-white/30 placeholder-white/70 focus:outline-none"
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
            onClick={async () => {
              setSaving(true);
              try {
                const { data } = await api.put(`/code/snippet/${snippetId}`, { title, language, code });
                setSnippet(data);
              } catch (e) {
                setError(e?.response?.data?.error || "Failed to save changes");
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
            className="px-4 py-2 rounded-md bg-green-500/80 hover:bg-green-500 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
        <Editor height="600px" language={language} theme="vs-dark" value={code} onChange={setCode} options={{ automaticLayout: true }} />
        <div className="mt-4">
          <button
            onClick={async () => {
              setRunning(true);
              setOutput("");
              try {
                const jdLang = language === "javascript" ? "nodejs" : language === "python" ? "python3" : language;
                const { data } = await api.post("/execute", {
                  script: code,
                  language: jdLang,
                  versionIndex: "0",
                });
                setOutput(data.output || data.error || "");
              } catch (e) {
                setOutput("Failed to run code");
              } finally {
                setRunning(false);
              }
            }}
            disabled={running}
            className="px-4 py-2 rounded-md bg-blue-500/80 hover:bg-blue-500 disabled:opacity-60"
          >
            {running ? "Running..." : "Run Code"}
          </button>
        </div>
      </div>
      <div className="p-4 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md" style={{ WebkitBackdropFilter: "blur(12px)" }}>
        <h3 className="text-lg font-semibold mb-2">Output</h3>
        <pre className="whitespace-pre-wrap text-white/90 min-h-[200px]">{output}</pre>
      </div>
    </div>
  );
}


