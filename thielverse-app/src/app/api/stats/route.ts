import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ error: "missing env" }, { status: 500 });
  const db = createClient(url, key);
  const { count } = await db.from("receipts").select("id", { count: "exact", head: true });
  const { data: latest } = await db
    .from("receipts")
    .select("published_at")
    .order("created_at", { ascending: false })
    .limit(1);
  return NextResponse.json({ total: count || 0, latest_at: latest?.[0]?.published_at || null });
}
