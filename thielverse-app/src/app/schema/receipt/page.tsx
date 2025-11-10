// thielverse-app/src/app/schema/receipt/page.tsx

export default function ReceiptSchemaPage() {
  return (
    <div className="py-8 rhythm-24">
      <div className="max-w-prose">
        <h1 className="text-3xl font-semibold tracking-tight">
          Receipt Schema (v1)
        </h1>
        <p className="mt-3 text-base leading-relaxed text-white/80">
          Atomic, append-only, verifiable. Each receipt is a cryptographically
          hashed record of frontier progress.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-white/70">
          <strong>Hash formula:</strong>{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5">
            sha256(url | published_at | title)
          </code>
        </p>
      </div>

      <pre className="paper mt-6 overflow-x-auto p-5 text-sm leading-relaxed text-white/90">
{`type Receipt = {
  id: string;                 // uuid
  source: string;             // host (e.g., "openai.com")
  title: string;
  url: string;                // canonical source link
  published_at: string;       // ISO date/time (UTC)
  frontier?: "AI" | "Energy" | "Biotech" | "Crypto" | "Defense" | "Robotics" | "Frontier Founders";
  hash: string;               // sha256(url|published_at|title)
  summary?: string;
  visible: boolean;
  cid?: string;               // analysis artifact id
  novelty_score?: number;     // 0-1, quality signal
  impact_score?: number;      // 0-1, quality signal
  created_at: string;
};`}
      </pre>

      <div className="mt-6 max-w-prose">
        <h2 className="text-lg font-semibold">Design Principles</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/80">
          <li className="flex gap-2">
            <span className="text-teal-400">•</span>
            <span>
              <strong>Immutable:</strong> We never overwrite receipts.
              Corrections are expressed as new receipts (nullifications).
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-teal-400">•</span>
            <span>
              <strong>Append-only:</strong> Receipts form an audit trail.
              Deletions are logical, not physical.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-teal-400">•</span>
            <span>
              <strong>Deterministic:</strong> Same inputs always produce the
              same hash. Enables deduplication and verification.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-teal-400">•</span>
            <span>
              <strong>Content-addressed intelligence:</strong> CID links to
              analysis JSON stored in Supabase Storage.
            </span>
          </li>
        </ul>
      </div>

      <div className="mt-8 rounded-xl border border-teal-500/20 bg-teal-500/5 p-4">
        <div className="text-sm font-medium text-teal-300">
          💡 Why this matters
        </div>
        <p className="mt-2 text-sm leading-relaxed text-white/80">
          Verified receipts are the foundation for trustworthy AI reasoning.
          When every claim traces back to a hashed, timestamped source, models
          become auditable and hallucinations become detectable.
        </p>
      </div>
    </div>
  );
}
