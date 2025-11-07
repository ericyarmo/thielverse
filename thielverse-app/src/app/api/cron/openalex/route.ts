import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) return NextResponse.json({ added: 0, error: "missing service env" }, { status: 500 });
    const supa = createClient(url, key);

    const res = await fetch("https://api.openalex.org/works?search=fusion&sort=publication_date:desc&per_page=3", { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ added: 0 });
    const json = await res.json();

    let added = 0;
    for (const w of (json?.results || [])) {
      const title = w.title || "Untitled";
      const srcUrl = (w.id || "").toString();
      const published_at = (w.published_date || (w.publication_year ? `${w.publication_year}-01-01T00:00:00Z` : new Date().toISOString()));
      const hash = crypto.createHash("sha256").update(`${srcUrl}|${published_at}|${title}`).digest("hex");
      const { error } = await supa.from("receipts").upsert({
        source: "OpenAlex",
        title,
        url: srcUrl,
        published_at,
        frontier: "Energy",
        hash,
        summary: "",
        visible: true
      }, { onConflict: "hash" });
      if (!error) added++;
    }
    return NextResponse.json({ added });
  } catch (e:any) {
    return NextResponse.json({ added: 0, error: String(e?.message||e) }, { status: 500 });
  }
}
