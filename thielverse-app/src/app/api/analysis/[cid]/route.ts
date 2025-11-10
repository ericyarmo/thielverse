// Force Node runtime & dynamic fetch
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

function cidFromRequest(url: string) {
  try {
    return url.split("/api/analysis/")[1]?.split("?")[0]?.trim() || null;
  } catch {
    return null;
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ cid: string }> }
) {
  const url = process.env.SUPABASE_URL!;
  const anon = process.env.SUPABASE_ANON_KEY!;
  const bucket = process.env.SUPABASE_BUCKET_ANALYSES || "analyses";

  // Await params in Next.js 16
  const { cid: paramCid } = await params;
  const cid = paramCid || cidFromRequest(new URL(req.url).toString());

  if (!cid)
    return new Response(
      JSON.stringify({ error: "BAD_REQUEST", detail: "Missing cid" }),
      { status: 400 }
    );
  if (!url || !anon)
    return new Response(JSON.stringify({ error: "MISCONFIGURED_ENV" }), {
      status: 500,
    });

  // Try SDK download (public bucket is fine with anon key)
  try {
    const sb = createClient(url, anon, { auth: { persistSession: false } });
    const dl = await sb.storage.from(bucket).download(`${cid}.json`);
    if (!dl.error) {
      const text = await dl.data.text();
      return new Response(text, {
        status: 200,
        headers: { "content-type": "application/json", etag: cid },
      });
    }
  } catch {
    /* fall through */
  }

  // Fallback: direct public URL
  const publicUrl = `${url}/storage/v1/object/public/${bucket}/${cid}.json`;
  const r = await fetch(publicUrl, { cache: "no-store" });
  if (r.ok) {
    const text = await r.text();
    return new Response(text, {
      status: 200,
      headers: { "content-type": "application/json", etag: cid },
    });
  }

  return new Response(
    JSON.stringify({ error: "NOT_FOUND", detail: { bucket, cid } }),
    { status: 404 }
  );
}
