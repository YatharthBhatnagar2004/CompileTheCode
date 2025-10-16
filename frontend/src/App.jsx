import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";

function App() {
  const [code, setCode] = useState(
    "// Write your code here\nconsole.log('Hello, World!');"
  );
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [snippetId, setSnippetId] = useState(null);
  const [loadSnippetId, setLoadSnippetId] = useState("");

  // Language options
  const languages = [
    { value: "javascript", label: "JavaScript", jdoodleLang: "nodejs" },
    { value: "python", label: "Python", jdoodleLang: "python3" },
    { value: "cpp", label: "C++", jdoodleLang: "cpp" },
    { value: "java", label: "Java", jdoodleLang: "java" },
  ];

  // Default code for each language
  const getDefaultCode = (lang) => {
    switch (lang) {
      case "javascript":
        return "// Write your code here\nconsole.log('Hello, World!');";
      case "python":
        return "# Write your code here\nprint('Hello, World!')";
      case "cpp":
        return '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}';
      case "java":
        return 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}';
      default:
        return "";
    }
  };

  // Update code when language changes
  useEffect(() => {
    setCode(getDefaultCode(language));
  }, [language]);

  // Execute code using backend proxy
  const executeCode = async () => {
    setLoading(true);
    setOutput("");
    try {
      const selectedLang = languages.find((lang) => lang.value === language);
      const response = await axios.post("http://localhost:5000/api/execute", {
        script: code,
        language: selectedLang.jdoodleLang,
        versionIndex: "0",
      });
      setOutput(response.data.output || "Error: " + response.data.error);
    } catch (error) {
      setOutput("Error: Failed to execute code.");
    }
    setLoading(false);
  };

  // Save code snippet to backend
  const saveCode = async () => {
    try {
      const response = await axios.post("http://localhost:5000/api/snippets", {
        code,
        language,
      });
      setSnippetId(response.data.id);
      alert("Code saved! Share this ID: " + response.data.id);
    } catch (error) {
      alert("Error saving code.");
    }
  };

  // Load code snippet by ID
  const loadCode = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/snippets/${loadSnippetId}`
      );
      setCode(response.data.code);
      setLanguage(response.data.language);
    } catch (error) {
      alert("Error loading code.");
    }
  };

  // Download code as a file
  const downloadCode = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${language}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold text-center mb-6">
        Online Code Compiler
      </h1>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Code Editor Section */}
        <div className="flex-1">
          <div className="flex justify-between items-center md:mb-4 mb-4">
            <select
              className="p-2 bg-gray-800 rounded"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
            <div className="space-x-2">
              <button
                className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
                onClick={executeCode}
                disabled={loading}
              >
                {loading ? "Running..." : "Run Code"}
              </button>
              <button
                className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
                onClick={saveCode}
              >
                Save Code
              </button>
              <button
                className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700"
                onClick={downloadCode}
              >
                Download
              </button>
            </div>
          </div>
          <Editor
            height="400px"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value)}
            options={{ automaticLayout: true }}
          />
        </div>

        {/* Output Section */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold md:mb-8 mb-4">Output</h2>
          <pre className="p-4 bg-gray-800 rounded h-96 overflow-auto">
            {output}
          </pre>
        </div>
      </div>

      {/* Load Snippet Section */}
      <div className="my-8">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter Snippet ID to load"
            className="p-2 bg-gray-800 rounded w-full lg:w-1/3"
            value={loadSnippetId}
            onChange={(e) => setLoadSnippetId(e.target.value)}
          />
          <button
            className="px-4 py-2 bg-yellow-600 rounded hover:bg-yellow-700"
            onClick={loadCode}
          >
            Load Code
          </button>
        </div>

        {snippetId && (
          <p className="mt-2 mb-10">
            Share this ID to load your code: <strong>{snippetId}</strong>
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
