import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const LENSES = {
  "engineer-realist": { max: 5, desc: "Technical progress & bottlenecks." },
  "market-mapper": { max: 4, desc: "Funding & partnerships." },
} as const;

export async function GET(
  _: Request,
  { params }: { params: Promise<{ name: string; slug: string }> }
) {
  // Await params in Next.js 16
  const { name: paramName, slug } = await params;
  const name = paramName as keyof typeof LENSES;

  if (!LENSES[name])
    return NextResponse.json({ error: "unknown lens" }, { status: 404 });

  const url = process.env.SUPABASE_URL!,
    key = process.env.SUPABASE_ANON_KEY!;
  const db = createClient(url, key);
  const { data: ent } = await db
    .from("entities")
    .select("id,slug,name")
    .eq("slug", slug)
    .maybeSingle();
  if (!ent)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: rows } = await db
    .rpc("entity_receipts_recent", { p_slug: slug, p_limit: 20 }) // or join manually if you don't have the RPC
    .select();

  const receipts = Array.isArray(rows) ? rows : [];
  if (receipts.length === 0)
    return NextResponse.json({ answer: "Not enough receipts." });

  // Deterministic: sort by published_at asc, hash asc
  receipts.sort((a: any, b: any) =>
    a.published_at < b.published_at
      ? -1
      : a.published_at > b.published_at
      ? 1
      : a.hash < b.hash
      ? -1
      : 1
  );

  // Format output with [R#] citations only from local receipts
  const lines: string[] = [];
  const take = receipts.slice(-LENSES[name].max);
  take.forEach((r: any, i: number) => {
    const R = `[R${i + 1}]`;
    if (name === "engineer-realist") lines.push(`${r.title} — ${r.source} ${R}`);
    else lines.push(`${r.source}: ${r.title} ${R}`);
  });

  const citations = take.map((r: any, i: number) => ({
    ref: `R${i + 1}`,
    title: r.title,
    url: r.url,
    source: r.source,
    date: r.published_at,
  }));
  return NextResponse.json({
    entity: ent.slug,
    lens: name,
    answer: lines.join("\n"),
    citations,
  });
}
