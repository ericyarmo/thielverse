import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const FRONTS = ["AI", "Energy", "Biotech", "Thielverse"];

export async function GET() {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ error: "missing env" }, { status: 500 });
  const supa = createClient(url, key);

  // counts per frontier
  const counts: Record<string, number> = {};
  for (const f of FRONTS) {
    const { count } = await supa
      .from("receipts")
      .select("id", { count: "exact", head: true })
      .eq("visible", true)
      .eq("frontier", f);
    counts[f] = count || 0;
  }

  // latest items per frontier
  const sections: Record<string, any[]> = {};
  for (const f of FRONTS) {
    const { data } = await supa
      .from("receipts")
      .select("id,title,source,url,published_at,frontier,hash")
      .eq("visible", true)
      .eq("frontier", f)
      .order("published_at", { ascending: false })
      .limit(3);
    sections[f] = data || [];
  }

  return NextResponse.json({
    headline: "Frontier pulse",
    as_of: new Date().toISOString(),
    counts,
    sections
  });
}
