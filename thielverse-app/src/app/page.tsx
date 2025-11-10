// thielverse-app/src/app/page.tsx

import Header from "./components/Header";
import FilterPills from "./components/FilterPills";
import ReceiptTable, { ReceiptRow } from "./components/ReceiptTable";
import { SearchBar } from "./components/SearchBar";
import ViewControls from "./components/ViewControls";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!; // server-only

const FRONTIERS = [
  { key: undefined, label: "All" },
  { key: "AI", label: "AI" },
  { key: "Biotech", label: "Biotech" },
  { key: "Crypto", label: "Crypto" },
  { key: "Defense", label: "Defense" },
  { key: "Energy", label: "Energy" },
  { key: "Robotics", label: "Robotics" },
  { key: "Frontier Founders", label: "Frontier Founders" },
  { key: "Telecom", label: "Telecom" },
];

function safeHost(url?: string, fallback?: string) {
  try {
    return url ? new URL(url).host : fallback || "";
  } catch {
    return fallback || "";
  }
}

async function fetchData(frontier?: string, limit?: string, sort?: string) {
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

  const limitNum = Math.min(Number(limit || 50), 200);
  const ascending = sort === "asc";

  const receiptsQ = sb
    .from("receipts")
    .select("source,title,url,published_at,frontier,cid", { count: "exact" })
    .eq("visible", true)
    .order("published_at", { ascending })
    .limit(limitNum);
  if (frontier) receiptsQ.eq("frontier", frontier);

  const [{ data: receipts, count: rc }, { count: ac }, { count: ec }] =
    await Promise.all([
      receiptsQ,
      sb.from("analyses").select("*", { count: "exact", head: true }),
      sb.from("entities").select("slug", { count: "exact", head: true }),
    ]);

  const rows: ReceiptRow[] = (receipts || []).map((r) => ({
    date: new Date(r.published_at).toISOString().slice(0, 10),
    frontier: r.frontier ?? "",
    source: safeHost(r.url, r.source),
    title: r.title,
    cid: r.cid ?? null,
  }));

  return {
    rows,
    counts: { receipts: rc ?? 0, analyses: ac ?? 0, entities: ec ?? 0 },
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ f?: string; limit?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const active = sp?.f;
  const limit = sp?.limit;
  const sort = sp?.sort;
  const { rows, counts } = await fetchData(active, limit, sort);

  return (
    <>
      <Header counts={counts} />

      {/* Search */}
      <div className="mt-8" style={{ maxWidth: "42rem" }}>
        <SearchBar />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Frontier Feed
        </h1>
        <div className="text-xs text-white/55">
          Public view delayed 7 days
        </div>
      </div>

      {/* View Controls */}
      <div className="mt-5 flex items-center justify-between">
        <FilterPills items={FRONTIERS} active={active} />
        <ViewControls limit={limit} sort={sort} frontier={active} />
      </div>

      <div className="paper mt-6 overflow-hidden">
        <ReceiptTable rows={rows} />
      </div>
    </>
  );
}
