import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GET /api/search?q=query
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("q") || "").trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ entities: [], receipts: [] });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "missing env" }, { status: 500 });
  }

  const supa = createClient(url, key, { auth: { persistSession: false } });

  // Search entities by name or slug (case-insensitive)
  const { data: entities } = await supa
    .from("entities")
    .select("slug,name,kind")
    .or(`name.ilike.%${query}%,slug.ilike.%${query}%`)
    .limit(5);

  // Search receipts by title or source (case-insensitive, visible only)
  const { data: receipts } = await supa
    .from("receipts")
    .select("title,source,published_at,frontier,cid,url")
    .eq("visible", true)
    .or(`title.ilike.%${query}%,source.ilike.%${query}%`)
    .order("published_at", { ascending: false })
    .limit(8);

  return NextResponse.json({
    query,
    entities: entities || [],
    receipts: (receipts || []).map((r) => ({
      title: r.title,
      source: r.source,
      date: new Date(r.published_at).toISOString().slice(0, 10),
      frontier: r.frontier,
      cid: r.cid,
      url: r.url,
    })),
  });
}
