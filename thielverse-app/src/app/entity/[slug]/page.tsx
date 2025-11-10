// thielverse-app/src/app/entity/[slug]/page.tsx

import ReceiptTable, { ReceiptRow } from "@/app/components/ReceiptTable";
import { AskBar } from "@/app/components/AskBar";
import ViewControls from "@/app/components/ViewControls";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="text-xs font-medium text-white/55">{label}</div>
      <div className="text-lg font-semibold tabular-nums text-white">{value}</div>
    </div>
  );
}

export default async function EntityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ limit?: string; sort?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const limit = sp?.limit;
  const sort = sp?.sort;

  const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

  const { data: ent } = await sb
    .from("entities")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  const { data: links } = await sb
    .from("entity_receipt")
    .select("receipt_id")
    .eq("entity_id", ent?.id || "");
  const ids = (links || []).map((l) => l.receipt_id);

  const limitNum = Math.min(Number(limit || 50), 200);
  const ascending = sort === "asc";

  let rows: ReceiptRow[] = [];
  if (ids.length) {
    const { data: rs } = await sb
      .from("receipts")
      .select("title,url,published_at,frontier,cid,source")
      .in("id", ids)
      .order("published_at", { ascending })
      .limit(limitNum);
    rows = (rs || []).map((r) => ({
      date: new Date(r.published_at).toISOString().slice(0, 10),
      frontier: r.frontier ?? "",
      source: r.source,
      title: r.title,
      cid: r.cid ?? null,
    }));
  }

  const analysisCount = rows.filter((r) => !!r.cid).length;

  return (
    <div className="py-6 rhythm-32">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-white/55" aria-label="Breadcrumb">
        <a href="/" className="hover:text-white/80 transition-colors">
          Home
        </a>
        <span className="text-white/30">/</span>
        <a href="/entity" className="hover:text-white/80 transition-colors">
          Entity
        </a>
        <span className="text-white/30">/</span>
        <span className="text-white/90">{slug}</span>
      </nav>

      {/* Hero */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            {ent?.name || slug}
          </h1>
          <div className="mt-1.5 text-sm text-white/65">
            {rows.length} receipts · kind: {ent?.kind ?? "org"}
          </div>
        </div>
        <div className="flex gap-3">
          <Stat label="Receipts" value={rows.length} />
          <Stat label="Analyses" value={analysisCount} />
        </div>
      </div>

      {/* AskBar */}
      <AskBar slug={slug} />

      {/* View Controls */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ViewControls limit={limit} sort={sort} />
      </div>

      {/* Receipts Table */}
      <div className="paper overflow-hidden">
        <ReceiptTable rows={rows} />
      </div>
    </div>
  );
}
