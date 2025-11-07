import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GET /api/ask?q=helion
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  if (!q) return NextResponse.json({ error: "missing q" }, { status: 400 });

  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ error: "missing env" }, { status: 500 });
  const supa = createClient(url, key);

  // entity
  const { data: entity } = await supa
    .from("entities")
    .select("id,slug,name,kind")
    .eq("slug", q)
    .maybeSingle();
  if (!entity) return NextResponse.json({ answer: `No entity found for "${q}".` });

  // last 5 linked receipts
  const { data: links } = await supa
    .from("entity_receipt")
    .select("receipt_id")
    .eq("entity_id", entity.id)
    .limit(50);

  const ids = (links ?? []).map(l => l.receipt_id);
  if (!ids.length) return NextResponse.json({ answer: `${entity.name}: no receipts yet.` });

  const { data: receipts } = await supa
    .from("receipts")
    .select("title,source,published_at,frontier,url")
    .in("id", ids)
    .order("published_at", { ascending: false })
    .limit(5);

  // heuristic summary (no LLM)
  const bullets = (receipts ?? []).map(r =>
    `• ${new Date(r.published_at).toISOString().slice(0,10)} — ${r.source}: ${r.title}`
  );
  const answer = `${entity.name} — last ${bullets.length} receipts:\n${bullets.join("\n")}`;

  return NextResponse.json({ entity, answer, receipts: receipts ?? [] });
}
