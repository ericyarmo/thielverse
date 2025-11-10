// src/app/components/Header.tsx (Server Component-friendly)

export default function Header({
  counts,
}: {
  counts: { receipts: number; entities: number; analyses: number };
}) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(0,0,0,0.08)",
        paddingTop: "1.5rem",
        paddingBottom: "1.5rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: "1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
          <a
            href="/"
            className="text-slate-900 font-bold tracking-tight text-2xl underline decoration-black/20 underline-offset-4"
            style={{ lineHeight: 1.2 }}
          >
            Frontier Index
          </a>

          {/* Tagline: readable on white */}
          <div className="text-sm text-slate-500">
            by Omni Intelligence Services, turning public data into verified intelligence
          </div>
        </div>

        {/* Demo badge: black pill */}
        <span className="ml-2 inline-flex items-center rounded-full border border-black bg-black px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
          72-hour demo
        </span>

        {/* Nav */}
        <nav className="ml-6 flex items-baseline gap-6 text-[0.95rem]">
          <a href="/" className="text-slate-900 underline decoration-black/25 underline-offset-4 hover:text-green-600">
            Feed
          </a>
          <a
            href="/schema/receipt"
            className="text-slate-900 underline decoration-black/25 underline-offset-4 hover:text-green-600"
          >
            Schema
          </a>
          <a
            href="/api/openapi"
            target="_blank"
            rel="noreferrer"
            className="text-slate-900 underline decoration-black/25 underline-offset-4 hover:text-green-600"
          >
            OpenAPI ↗
          </a>
        </nav>
      </div>

      {/* Counters */}
      <div className="flex items-baseline gap-8 text-[0.95rem] text-slate-900">
        <div>
          <span className="text-slate-600">Receipts</span>{" "}
          <span className="font-semibold tabular-nums">{counts.receipts}</span>
        </div>
        <div>
          <span className="text-slate-600">Entities</span>{" "}
          <span className="font-semibold tabular-nums">{counts.entities}</span>
        </div>
        <div>
          <span className="text-slate-600">Analyses</span>{" "}
          <span className="font-semibold tabular-nums">{counts.analyses}</span>
        </div>
      </div>
    </header>
  );
}
