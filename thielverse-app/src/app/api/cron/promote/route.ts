import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return NextResponse.json({ error: "missing service env" }, { status: 500 });
  const supa = createClient(url, key);

  const { data } = await supa
    .from("receipts")
    .select("id")
    .eq("visible", false)
    .order("published_at", { ascending: false })
    .limit(3);
  if (data?.length) {
    await supa.from("receipts").update({ visible: true }).in("id", data.map(d=>d.id));
  }
  return NextResponse.json({ promoted: data?.length || 0 });
}
