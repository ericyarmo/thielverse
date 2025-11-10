// src/app/components/AnalysisModal.tsx
"use client";

import { useEffect, useState } from "react";

type Artifact = {
  receipt_hash: string;
  meta: {
    title: string;
    url: string;
    published_at: string;
    frontier: string;
    entities: string[];
    summary?: string;
  };
  technical?: { notes?: string };
  market?: { notes?: string };
  regulatory?: { notes?: string };
  sentiment?: { overall?: string; confidence?: number };
  lenses?: Record<
    string,
    { output: string; citations: string[]; computed_at: string }
  >;
};

export function AnalysisModal({
  cid,
  open,
  onClose,
}: {
  cid: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !cid) return;
    setLoading(true);
    setErr(null);
    setData(null);
    fetch(`/api/analysis/${cid}`, { cache: "no-store" })
      .then(async (r) => (r.ok ? setData(await r.json()) : setErr("Not found")))
      .catch(() => setErr("Network error"))
      .finally(() => setLoading(false));
  }, [open, cid]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="w-full max-w-4xl"
        style={{
          borderRadius: '1rem',
          background: 'rgb(5, 5, 5)',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'start',
          gap: '0.75rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '1.5rem'
        }}>
          {loading ? (
            <div style={{
              height: '1.5rem',
              width: '66%',
              borderRadius: '0.25rem',
              background: 'rgba(255, 255, 255, 0.1)',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }} />
          ) : err ? (
            <div style={{ fontSize: '0.875rem', color: '#f87171' }}>{err}</div>
          ) : (
            <>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: '9999px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '0.25rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'rgba(255, 255, 255, 0.75)'
              }}>
                {data?.meta.frontier || "Frontier"}
              </span>
              <h2
                id="modal-title"
                style={{
                  flex: 1,
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  lineHeight: 1.4,
                  color: 'white'
                }}
              >
                {data?.meta.title}
              </h2>
            </>
          )}
          <span style={{
            marginLeft: 'auto',
            whiteSpace: 'nowrap',
            borderRadius: '9999px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '0.25rem 0.625rem',
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.65)'
          }}>
            Public (7-day delay) • Pro = real-time
          </span>
        </div>

        {/* Body */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '1.5rem',
          padding: '1.5rem'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.5rem' }}>
            {/* Left meta */}
            <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {loading ? (
                <>
                  <div style={{ height: '1rem', width: '6rem', borderRadius: '0.25rem', background: 'rgba(255, 255, 255, 0.1)', animation: 'pulse 2s infinite' }} />
                  <div style={{ height: '1rem', width: '10rem', borderRadius: '0.25rem', background: 'rgba(255, 255, 255, 0.1)', animation: 'pulse 2s infinite' }} />
                  <div style={{ height: '5rem', borderRadius: '0.25rem', background: 'rgba(255, 255, 255, 0.1)', animation: 'pulse 2s infinite' }} />
                </>
              ) : (
                <>
                  <Meta label="Published">
                    {data && new Date(data.meta.published_at).toISOString().slice(0, 10)}
                  </Meta>

                  <Meta label="Entities">
                    <div style={{ marginTop: '0.375rem', display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {(data?.meta.entities || []).map((e) => (
                        <a
                          key={e}
                          href={`/entity/${slugify(e)}`}
                          className="modal-entity-link"
                        >
                          {e}
                        </a>
                      ))}
                    </div>
                  </Meta>

                  {data?.meta.summary && (
                    <Meta label="Summary">
                      <p style={{ lineHeight: 1.6, color: 'rgba(255, 255, 255, 0.9)' }}>
                        {data.meta.summary}
                      </p>
                    </Meta>
                  )}

                  {data?.meta.url && (
                    <div style={{ fontSize: '0.75rem', color: 'rgba(163, 163, 163, 1)' }}>
                      <a
                        style={{
                          textDecoration: 'underline',
                          textDecorationColor: 'rgba(255, 255, 255, 0.3)',
                          textUnderlineOffset: '2px'
                        }}
                        href={data.meta.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Source ↗
                      </a>{" "}
                      · Hash{" "}
                      <code style={{
                        userSelect: 'all',
                        borderRadius: '0.25rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '0 0.25rem'
                      }}>
                        {data?.receipt_hash.slice(0, 16)}...
                      </code>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right intelligence */}
            <div style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Section
                title="Technical"
                className="section-sky"
                body={loading ? null : data?.technical?.notes}
                loading={loading}
              />
              <Section
                title="Market"
                className="section-emerald"
                body={loading ? null : data?.market?.notes}
                loading={loading}
              />
              <Section
                title="Regulatory"
                className="section-amber"
                body={loading ? null : data?.regulatory?.notes}
                loading={loading}
              />
              <Section
                title="Lens — Engineer Realist"
                className="section-violet"
                body={loading ? null : data?.lenses?.["engineer-realist"]?.output}
                tiny
                loading={loading}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '1.5rem'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(163, 163, 163, 1)' }}>
            {loading
              ? "Loading…"
              : data?.sentiment?.overall
              ? `Sentiment: ${data.sentiment.overall} (${
                  data.sentiment.confidence ?? "—"
                })`
              : ""}
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="modal-close-btn"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '0.875rem' }}>
      <div style={{ marginBottom: '0.25rem', color: 'rgba(255, 255, 255, 0.6)' }}>{label}</div>
      <div style={{ fontWeight: 500, color: 'rgba(255, 255, 255, 0.95)' }}>{children}</div>
    </div>
  );
}

function Section({
  title,
  className,
  body,
  tiny,
  loading,
}: {
  title: string;
  className: string;
  body?: string | null;
  tiny?: boolean;
  loading?: boolean;
}) {
  if (loading || !body || !body.trim()) {
    return (
      <div className={className} style={{ borderRadius: '0.75rem', border: '1px solid', padding: '1rem' }}>
        <div style={{
          marginBottom: '0.5rem',
          fontSize: '0.75rem',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'rgba(163, 163, 163, 1)'
        }}>
          {title}
        </div>
        <div style={{ height: '1rem', width: '75%', borderRadius: '0.25rem', background: 'rgba(255, 255, 255, 0.1)', animation: 'pulse 2s infinite' }} />
        <div style={{ marginTop: '0.5rem', height: '1rem', width: '66%', borderRadius: '0.25rem', background: 'rgba(255, 255, 255, 0.1)', animation: 'pulse 2s infinite' }} />
      </div>
    );
  }

  return (
    <div className={className} style={{ borderRadius: '0.75rem', border: '1px solid', padding: '1rem' }}>
      <div style={{
        marginBottom: '0.5rem',
        fontSize: '0.75rem',
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'rgba(163, 163, 163, 1)'
      }}>
        {title}
      </div>
      <p style={{
        lineHeight: 1.6,
        color: 'rgba(255, 255, 255, 1)',
        fontSize: tiny ? '0.875rem' : '1rem'
      }}>
        {body}
      </p>
    </div>
  );
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
