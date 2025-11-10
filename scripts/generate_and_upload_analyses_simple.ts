// scripts/generate_and_upload_analyses_simple.ts
import 'dotenv/config';
import fs from "node:fs";
import { parse } from "csv-parse/sync";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

type Row = {
  ["Title"]: string;
  ["Source / Link"]: string;
  ["Date (YYYY-MM)"]?: string;
  ["Date"]?: string;
  ["Frontier"]: string;
  ["Entities (comma-separated)"]?: string;
  ["Summary (1–2 sentences)"]?: string;
  ["Entity Links"]?: string;
  ["Technical Intelligence"]?: string;
  ["Market Intelligence"]?: string;
  ["Regulatory Intelligence"]?: string;
  ["Sentiment (tone + confidence)"]?: string;
};

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
  auth: { persistSession: false }
});
const BUCKET = process.env.SUPABASE_BUCKET_ANALYSES || "analyses";

const sha256Hex = (s: string) => createHash("sha256").update(s).digest("hex");
const toSlug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const splitList = (s?: string) => (s || "").split(",").map(x => x.trim()).filter(Boolean);

function isoFromDateish(s: string) {
  const t = (s || "").trim();
  if (!t) return new Date(0).toISOString();
  const m = t.match(/^(\d{4})-(\d{2})$/);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, 1)).toISOString();
  const d = new Date(t);
  return isNaN(+d) ? new Date(Date.UTC(1970, 0, 1)).toISOString()
                   : new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

function parseSentiment(s?: string) {
  const low = (s || "").toLowerCase();
  const overall = low.includes("mixed") ? "mixed"
                : low.includes("cautious") ? "cautious"
                : low.includes("neutral") ? "neutral" : "positive";
  const confMatch = low.match(/([01]\.\d+|\b0?\.\d+\b|\b1(?:\.0+)?\b|\b0(?:\.0+)?\b)/);
  const confidence = confMatch ? Math.min(1, Math.max(0, Number(confMatch[1]))) : undefined;
  return { overall, confidence };
}

function canonicalArtifact(row: Row) {
  const title = (row["Title"] || "").trim();
  const url = (row["Source / Link"] || "").trim();
  const published_at = isoFromDateish((row["Date (YYYY-MM)"] || row["Date"] || "").trim());
  const frontier = (row["Frontier"] || "").trim();
  const entities = splitList(row["Entities (comma-separated)"]);
  const summary = (row["Summary (1–2 sentences)"] || "").trim();
  const sentiment = parseSentiment(row["Sentiment (tone + confidence)"]);

  // This object is the canonical bytes we hash for a deterministic ID
  const artifact = {
    version: "v1",
    meta: { title, url, published_at, frontier, entities, summary },
    entity_links: entities.map(e => ({ slug: toSlug(e), confidence: 0.8 })),
    technical: { notes: (row["Technical Intelligence"] || "").trim() },
    market: { notes: (row["Market Intelligence"] || "").trim() },
    regulatory: { notes: (row["Regulatory Intelligence"] || "").trim() },
    sentiment,
    lenses: {
      "engineer-realist": {
        output: summary ? `${summary} [R1]` : "",
        citations: summary ? ["R1"] : [],
        computed_at: new Date().toISOString()
      }
    }
  };

  return artifact;
}

async function main() {
  const csvPath = process.argv[2] || "./thielverse-app/data/demo_receipts.csv";
  if (!fs.existsSync(csvPath)) { console.error(`CSV not found: ${csvPath}`); process.exit(1); }
  const csv = fs.readFileSync(csvPath, "utf8");
  const rows = parse(csv, { columns: true, skip_empty_lines: true }) as Row[];

  let ok = 0, miss = 0;
  for (const r of rows) {
    const art = canonicalArtifact(r);

    // Deterministic "cid-like" id = sha256 of canonical JSON
    const canonical = JSON.stringify(art);
    const fakeCid = `sha256-${sha256Hex(canonical)}`; // stable ID
    const storagePath = `${fakeCid}.json`;

    // Compute the *receipt* hash (must match receipts.hash)
    const title = art.meta.title, url = art.meta.url, published_at = art.meta.published_at;
    const receipt_hash = sha256Hex(`${url}|${published_at}|${title}`);

    // Upload artifact (with id & receipt_hash echoed inside)
    const blob = JSON.stringify({ ...art, id: fakeCid, receipt_hash, storage_path: storagePath }, null, 2);
    const up = await sb.storage.from(BUCKET).upload(storagePath, blob, { contentType: "application/json", upsert: true });
    if (up.error) { miss++; console.error("Storage upload failed:", title, up.error.message); continue; }

    // Upsert analyses
    const { error: aErr } = await sb.from("analyses").upsert({
      cid: fakeCid, receipt_hash, version: "v1", storage_path: storagePath
    }, { onConflict: "cid" });
    if (aErr) { miss++; console.error("Analyses upsert failed:", title, aErr.message); continue; }

    // Update receipt with id + demo scores
    const novelty = /breakthrough|first|novel|prototype/i.test(art.technical.notes) ? 0.8 : 0.6;
    const impact = /high|partnership|funding|tvl|contract|ppa|approval/i.test(art.market.notes) ? 0.75 : 0.6;

    const { error: rErr, data: rData } = await sb.from("receipts")
      .update({ cid: fakeCid, novelty_score: novelty, impact_score: impact })
      .eq("hash", receipt_hash)
      .select("id");
    if (rErr) { miss++; console.error("Receipt update failed:", title, rErr.message); continue; }

    console.log(`✔ ${title} → ${fakeCid} (linked receipts: ${rData?.length || 0})`);
    ok++;
  }

  console.log(`\nDone. Success: ${ok}, Failed: ${miss}`);
}

main().catch(e => { console.error(e); process.exit(1); });
