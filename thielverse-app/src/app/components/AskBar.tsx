"use client";

import { useState } from "react";

export function AskBar({ slug }: { slug: string }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/ask?q=${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data.answer || "No answer available.");
      } else {
        setResult("Failed to fetch answer.");
      }
    } catch {
      setResult("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="paper" style={{ padding: '1.25rem' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
        <input
          type="text"
          placeholder={`Ask about ${slug}...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
          aria-label="Ask question"
          className="ask-input"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="ask-button"
        >
          {loading ? "Asking..." : "Ask"}
        </button>
      </form>

      {result && (
        <div style={{
          marginTop: '1.25rem',
          borderRadius: '0.75rem',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '1.25rem'
        }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'rgba(255, 255, 255, 0.55)',
            marginBottom: '0.75rem'
          }}>
            Answer
          </div>
          <div style={{
            fontSize: '0.875rem',
            lineHeight: 1.65,
            color: 'rgba(255, 255, 255, 0.9)'
          }}>
            {result.split("\n").map((line, i) => {
              if (line.startsWith("• ") || line.startsWith("- ")) {
                return (
                  <li key={i} style={{ marginLeft: '1.25rem', listStyleType: 'disc', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.85)' }}>
                    {line.slice(2)}
                  </li>
                );
              }
              return (
                <p key={i} style={{ marginBottom: '0.625rem' }}>
                  {line}
                </p>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
