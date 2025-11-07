import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params; // ← unwrap the Promise
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ error: "missing env" }, { status: 500 });
  const supa = createClient(url, key);

  // 1) entity
  const { data: entity, error: e1 } = await supa
    .from("entities")
    .select("id,slug,name,kind,profile")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });
  if (!entity) return NextResponse.json({ error: "not found" }, { status: 404 });

  // 2) links → ids
  const { data: links, error: e2 } = await supa
    .from("entity_receipt")
    .select("receipt_id")
    .eq("entity_id", entity.id)
    .limit(200);
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  const ids = (links ?? []).map(l => l.receipt_id);
  if (!ids.length) return NextResponse.json({ entity, receipts: [] });

  // 3) receipts
  const { data: receipts, error: e3 } = await supa
    .from("receipts")
    .select("id,source,title,url,published_at,frontier,hash,summary,visible,created_at")
    .in("id", ids)
    .order("published_at", { ascending: false })
    .limit(200);
  if (e3) return NextResponse.json({ error: e3.message }, { status: 500 });

  return NextResponse.json({ entity, receipts: receipts ?? [] });
}
