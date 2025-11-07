"use client";

import { useState } from "react";

export default function AskBox({ className = "" }: { className?: string }) {
  const [q, setQ] = useState("helion");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);

  async function onAsk(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setAnswer(null);
    try {
      const res = await fetch(`/api/ask?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      setAnswer(json?.answer ?? "No answer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <form onSubmit={onAsk} className="flex gap-2">
        <input
          className="flex-1 border rounded px-2 py-1 bg-transparent"
          placeholder="Ask about an entity (e.g., helion)"
          value={q}
          onChange={(e)=>setQ(e.target.value)}
        />
        <button className="border rounded px-3 py-1" disabled={loading}>
          {loading ? "…" : "Ask"}
        </button>
      </form>
      {answer && (
        <pre className="mt-2 text-xs whitespace-pre-wrap border rounded p-2">{answer}</pre>
      )}
    </div>
  );
}
