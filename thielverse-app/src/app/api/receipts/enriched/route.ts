import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) return NextResponse.json({ error: "missing env" }, { status: 500 });
    const supa = createClient(url, key);

    const { searchParams } = new URL(req.url);
    const frontier = searchParams.get("frontier") || undefined;
    const limit = Math.min(Number(searchParams.get("limit") || 50), 50);

    let q = supa
      .from("receipts")
      .select("id,source,title,url,published_at,frontier,hash,summary,created_at,entity_receipt:entity_receipt(receipt_id,entities:entities(slug,name))")
      .eq("visible", true)
      .order("published_at", { ascending: false })
      .limit(limit);

    if (frontier) q = q.eq("frontier", frontier);

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = (data || []).map((r: any) => ({
      id: r.id,
      source: r.source,
      title: r.title,
      url: r.url,
      published_at: r.published_at,
      frontier: r.frontier,
      hash: r.hash,
      summary: r.summary,
      created_at: r.created_at,
      entities: (r.entity_receipt || [])
        .map((er: any) => er?.entities)
        .filter(Boolean)
        .map((e: any) => ({ slug: e.slug, name: e.name })),
    }));

    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
