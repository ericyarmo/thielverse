import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const frontier = searchParams.get("frontier") || undefined;
    const limit = Math.min(Number(searchParams.get("limit") || 50), 50);
    const mode = searchParams.get("mode") || "public";
    const delayDays =
      mode === "public" ? Number(process.env.DEMO_DELAY_DAYS || "7") : 0;

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
      return NextResponse.json(
        { error: "Missing SUPABASE_URL or SUPABASE_ANON_KEY" },
        { status: 500 }
      );
    }

    const supa = createClient(url, key);

    let q = supa
      .from("receipts")
      .select(
        "id,source,title,url,published_at,frontier,hash,summary,visible,created_at"
      )
      .eq("visible", true)
      .order("published_at", { ascending: false })
      .limit(limit);

    if (delayDays > 0) {
      const cutoff = new Date(Date.now() - delayDays * 86400000).toISOString();
      q = q.lte("published_at", cutoff);
    }
    if (frontier) q = q.eq("frontier", frontier);

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
