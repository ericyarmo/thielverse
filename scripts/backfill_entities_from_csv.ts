import 'dotenv/config';
import fs from 'node:fs';
import { parse } from 'csv-parse/sync';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

type Row = {
  ["Title"]: string;
  ["Source / Link"]: string;
  ["Date (YYYY-MM)"]?: string;
  ["Date"]?: string;
  ["Frontier"]: string;
  ["Entities (comma-separated)"]?: string; // "Name" or "Name:kind"
};

const URL = process.env.SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_KEY!;
const sb = createClient(URL, KEY, { auth: { persistSession: false } });

const sha256Hex = (s: string) => createHash("sha256").update(s).digest("hex");
const toSlug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const isoFromDateish = (s: string) => {
  const t = (s || "").trim();
  if (!t) return new Date(0).toISOString();
  const m = t.match(/^(\d{4})-(\d{2})$/);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, 1)).toISOString();
  const d = new Date(t);
  return isNaN(+d) ? new Date(Date.UTC(1970,0,1)).toISOString()
                   : new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
};

function parseEntities(list?: string) {
  return (list || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => {
      const [name, kindRaw] = s.split(":").map(x => (x || "").trim());
      const kind = (kindRaw || "").toLowerCase();
      const normalizedKind = ["org","person","lab","fund","gov","team"].includes(kind) ? kind : "org";
      return { name, slug: toSlug(name), kind: normalizedKind };
    });
}

async function upsertEntities(unique: {slug:string; name:string; kind:string}[]) {
  if (unique.length === 0) return new Map<string, string>();
  const { data, error } = await sb.from("entities").upsert(unique, { onConflict: "slug" }).select("id,slug");
  if (error) throw error;
  const idBySlug = new Map<string, string>();
  (data || []).forEach(r => idBySlug.set(r.slug, r.id));
  const missing = unique.filter(u => !idBySlug.has(u.slug)).map(u => u.slug);
  if (missing.length) {
    const { data: back } = await sb.from("entities").select("id,slug").in("slug", missing);
    (back || []).forEach(r => idBySlug.set(r.slug, r.id));
  }
  return idBySlug;
}

async function link(slugToId: Map<string,string>, items: {hash:string, entities:{slug:string}[]}[]) {
  let linked = 0;
  for (const it of items) {
    const { data: rec } = await sb.from("receipts").select("id").eq("hash", it.hash).maybeSingle();
    if (!rec?.id) continue;
    const rows = it.entities
      .map(e => slugToId.get(e.slug))
      .filter(Boolean)
      .map(entity_id => ({ entity_id, receipt_id: rec.id, role: "mentioned" as const }));
    if (!rows.length) continue;
    const { error } = await sb.from("entity_receipt").upsert(rows, { onConflict: "entity_id,receipt_id" });
    if (error) throw error;
    linked += rows.length;
  }
  return linked;
}

async function main() {
  const csvPath = process.argv[2] || "./thielverse-app/data/demo_receipts.csv";
  if (!fs.existsSync(csvPath)) { console.error(`CSV not found: ${csvPath}`); process.exit(1); }
  const rows = parse(fs.readFileSync(csvPath, "utf8"), { columns: true, skip_empty_lines: true }) as Row[];

  const records: {hash:string; entities:{name:string; slug:string; kind:string}[]}[] = [];
  const allEntities: {slug:string; name:string; kind:string}[] = [];

  for (const r of rows) {
    const title = (r["Title"] || "").trim();
    const url = (r["Source / Link"] || "").trim();
    const published_at = isoFromDateish((r["Date (YYYY-MM)"] || r["Date"] || "").trim());
    if (!title || !url) continue;
    const hash = sha256Hex(`${url}|${published_at}|${title}`);
    const ents = parseEntities(r["Entities (comma-separated)"]);
    records.push({ hash, entities: ents });
    allEntities.push(...ents);
  }

  const unique = Object.values(allEntities.reduce((acc, e) => (acc[e.slug] ??= e, acc), {} as Record<string, any>));
  const slugToId = await upsertEntities(unique);
  const linked = await link(slugToId, records);
  console.log(`Entities upserted: ${unique.length}, Links created/verified: ${linked}`);
}
main().catch(e => { console.error(e); process.exit(1); });
