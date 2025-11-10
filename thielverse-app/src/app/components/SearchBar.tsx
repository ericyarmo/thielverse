"use client";

import { useState, useEffect, useRef } from "react";

type SearchResult = {
  query: string;
  entities: Array<{ slug: string; name: string; kind: string }>;
  receipts: Array<{
    title: string;
    source: string;
    date: string;
    frontier: string;
    cid?: string | null;
    url: string;
  }>;
};

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasResults = results && (results.entities.length > 0 || results.receipts.length > 0);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          placeholder="Search entities and receipts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => hasResults && setIsOpen(true)}
          className="ask-input"
          style={{ width: "100%", paddingRight: "2.5rem" }}
        />
        {loading && (
          <div
            style={{
              position: "absolute",
              right: "1rem",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "0.75rem",
              color: "rgba(255, 255, 255, 0.5)",
            }}
          >
            ...
          </div>
        )}
      </div>

      {isOpen && hasResults && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 0.5rem)",
            left: 0,
            right: 0,
            borderRadius: "0.75rem",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgb(5, 5, 5)",
            maxHeight: "28rem",
            overflowY: "auto",
            zIndex: 50,
          }}
        >
          {/* Entities */}
          {results.entities.length > 0 && (
            <div style={{ padding: "1rem" }}>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "rgba(255, 255, 255, 0.55)",
                  marginBottom: "0.75rem",
                }}
              >
                Entities
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {results.entities.map((entity) => (
                  <a
                    key={entity.slug}
                    href={`/entity/${entity.slug}`}
                    onClick={() => setIsOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.625rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      background: "rgba(255, 255, 255, 0.02)",
                      transition: "all 0.15s ease",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "white" }}>
                        {entity.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.5)" }}>
                        {entity.kind}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "rgba(255, 255, 255, 0.4)",
                      }}
                    >
                      →
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Receipts */}
          {results.receipts.length > 0 && (
            <div
              style={{
                padding: "1rem",
                borderTop:
                  results.entities.length > 0 ? "1px solid rgba(255, 255, 255, 0.08)" : "none",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "rgba(255, 255, 255, 0.55)",
                  marginBottom: "0.75rem",
                }}
              >
                Receipts
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {results.receipts.map((receipt, i) => (
                  <a
                    key={i}
                    href={receipt.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setIsOpen(false)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                      padding: "0.625rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      background: "rgba(255, 255, 255, 0.02)",
                      transition: "all 0.15s ease",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                    }}
                  >
                    <div style={{ fontSize: "0.875rem", color: "white", lineHeight: 1.4 }}>
                      {receipt.title}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.75rem",
                        color: "rgba(255, 255, 255, 0.5)",
                      }}
                    >
                      <span>{receipt.date}</span>
                      <span>·</span>
                      <span>{receipt.source}</span>
                      {receipt.frontier && (
                        <>
                          <span>·</span>
                          <span>{receipt.frontier}</span>
                        </>
                      )}
                      {receipt.cid && (
                        <>
                          <span>·</span>
                          <span style={{ color: "#10b981" }}>Analyzed</span>
                        </>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {results && !hasResults && (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                fontSize: "0.875rem",
                color: "rgba(255, 255, 255, 0.5)",
              }}
            >
              No results found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
