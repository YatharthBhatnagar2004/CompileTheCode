import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function MySnippets() {
  const [snippets, setSnippets] = useState([]);
  const [error, setError] = useState("");

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

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">My Snippets</h2>
      {error && <div className="mb-4 text-red-300">{error}</div>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {snippets.map((s) => (
          <Link
            key={s._id}
            to={`/editor/${s._id}`}
            className="block p-4 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition backdrop-blur-md"
            style={{ WebkitBackdropFilter: "blur(12px)" }}
          >
            <div className="text-sm text-white/70">{new Date(s.createdAt).toLocaleString()}</div>
            <div className="text-lg font-semibold">{s.title}</div>
            <div className="text-sm text-white/80">{s.language}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}


