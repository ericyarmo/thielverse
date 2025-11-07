"use client";
import { useState } from "react";

export default function AskBox({ className = "" }: { className?: string }) {
  const [q, setQ] = useState("");

  const ask = async () => {
    if (!q.trim()) return;
    const r = await fetch(`/api/ask?q=${encodeURIComponent(q)}`, { cache: "no-store" });
    const j = await r.json();
    alert(j?.answer || "No answer.");
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Ask about an entity (e.g., helion, openai, sama)"
        className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm outline-none focus:border-neutral-600"
      />
      <button
        onClick={ask}
        className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500 active:bg-teal-600"
      >
        Ask
      </button>
    </div>
  );
}
