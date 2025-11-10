// usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... npx tsx scripts/cleanup_orphan_analyses.ts
import { createClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_KEY!;
const BUCKET = process.env.SUPABASE_BUCKET_ANALYSES || "analyses";

if (!URL || !KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const sb = createClient(URL, KEY, { auth: { persistSession: false } });

async function listAll(prefix = "") {
  const pageSize = 1000;
  let page = 0;
  const out: { name: string }[] = [];
  for (;;) {
    const { data, error } = await sb.storage.from(BUCKET).list(prefix, { limit: pageSize, offset: page * pageSize });
    if (error) throw error;
    if (!data?.length) break;
    out.push(...data);
    if (data.length < pageSize) break;
    page += 1;
  }
  return out;
}

(async () => {
  // 1) CIDs that *should* exist (have source and cid)
  const { data: rows, error: qErr } = await sb
    .from("receipts")
    .select("cid")
    .not("cid", "is", null)
    .not("source", "is", null)
    .neq("source", "")
    .limit(200000); // plenty for demo
  if (qErr) throw qErr;

  const valid = new Set((rows || []).map(r => String(r.cid)));

  // 2) List storage objects
  const files = await listAll();
  const victims = files
    .map(f => f.name)
    .filter(n => n.endsWith(".json"))
    .filter(n => !valid.has(n.replace(/\.json$/,"")));

  // 3) Delete in batches
  const chunks = (arr: string[], n=100) => Array.from({length: Math.ceil(arr.length/n)},(_,i)=>arr.slice(i*n,(i+1)*n));
  let deleted = 0;
  for (const batch of chunks(victims, 100)) {
    const { error } = await sb.storage.from(BUCKET).remove(batch);
    if (error) throw error;
    deleted += batch.length;
  }

  console.log(`Cleanup complete. Valid CIDs: ${valid.size}. Deleted orphans: ${deleted}.`);
})();
