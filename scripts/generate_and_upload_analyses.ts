// scripts/generate_and_upload_analyses.ts
import fs from "node:fs";
import { parse } from "csv-parse/sync";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { CID } from "multiformats/cid";
import 'dotenv/config';  
import * as dagJson from "@ipld/dag-json";
import { sha256 as mfSha256 } from "multiformats/hashes/sha2";

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

function isoFromDateish(s: string) {
  const t = (s || "").trim();
  if (!t) return new Date(0).toISOString();
  const m = t.match(/^(\d{4})-(\d{2})$/);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, 1)).toISOString();
  const d = new Date(t);
  return isNaN(+d) ? new Date(Date.UTC(1970, 0, 1)).toISOString() : new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}
const sha256Hex = (s: string) => createHash("sha256").update(s).digest("hex");
const toSlug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const splitList = (s?: string) => (s || "").split(",").map(x => x.trim()).filter(Boolean);

function parseSentiment(s?: string) {
  const low = (s || "").toLowerCase();
  const overall = low.includes("mixed") ? "mixed" : low.includes("cautious") ? "cautious" : low.includes("neutral") ? "neutral" : "positive";
  const confMatch = low.match(/([01]\.\d+|\b0?\.\d+\b|\b1(?:\.0+)?\b|\b0(?:\.0+)?\b)/);
  const conf = confMatch ? Math.min(1, Math.max(0, Number(confMatch[1]))) : undefined;
  return { overall, conf };
}

async function cidFor(obj: object): Promise<string> {
  const bytes = dagJson.encode(obj as any);          // canonical dag-json
  const mh = await mfSha256.digest(bytes);           // sha256 multihash
  const cid = CID.createV1(dagJson.code, mh);
  return cid.toString();                              // bafy...
}

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const BUCKET = process.env.SUPABASE_BUCKET_ANALYSES || "analyses";
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) { console.error("Set SUPABASE_URL & SUPABASE_SERVICE_KEY"); process.exit(1); }
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

async function main() {
  const csvPath = process.argv[2] || "./thielverse-app/data/demo_receipts.csv";
  if (!fs.existsSync(csvPath)) { console.error(`CSV not found: ${csvPath}`); process.exit(1); }
  const csv = fs.readFileSync(csvPath, "utf8");
  const rows = parse(csv, { columns: true, skip_empty_lines: true }) as Row[];

  let ok = 0, miss = 0;
  for (const r of rows) {
    const title = (r["Title"] || "").trim();
    const url = (r["Source / Link"] || "").trim();
    const published_at = isoFromDateish((r["Date (YYYY-MM)"] || r["Date"] || "").trim());
    const frontier = (r["Frontier"] || "").trim();
    if (!title || !url || !frontier) { console.warn("Skipping (missing required fields):", title); continue; }

    const receipt_hash = sha256Hex(`${url}|${published_at}|${title}`);
    const entities = splitList(r["Entities (comma-separated)"]);
    const { overall, conf } = parseSentiment(r["Sentiment (tone + confidence)"]);

    // Build the stable artifact body (only stable fields feed the CID)
    const artifact = {
      version: "v1",
      meta: {
        title, url, published_at, frontier,
        entities,
        summary: (r["Summary (1–2 sentences)"] || "").trim()
      },
      entity_links: entities.map(e => ({ slug: toSlug(e), confidence: 0.8 })),
      technical: { notes: (r["Technical Intelligence"] || "").trim() },
      market: { notes: (r["Market Intelligence"] || "").trim() },
      regulatory: { notes: (r["Regulatory Intelligence"] || "").trim() },
      sentiment: { overall, confidence: conf },
      lenses: {
        "engineer-realist": {
          output: (r["Summary (1–2 sentences)"] || "").trim() + " [R1]",
          citations: ["R1"],
          computed_at: new Date().toISOString()
        }
      }
    };

    const cid = await cidFor(artifact);
    const storagePath = `${cid}.json`;

    // Upload JSON (upsert)
    const up = await sb.storage.from(BUCKET).upload(storagePath, JSON.stringify({ ...artifact, receipt_hash, cid, storage_path: storagePath }, null, 2), {
      contentType: "application/json",
      upsert: true
    });
    if (up.error) { miss++; console.error("Storage upload failed:", title, up.error.message); continue; }

    // Upsert analyses row
    const { error: aErr } = await sb.from("analyses").upsert({
      cid, receipt_hash, version: "v1", storage_path: storagePath
    }, { onConflict: "cid" });
    if (aErr) { miss++; console.error("Analyses upsert failed:", title, aErr.message); continue; }

    // Update receipt with cid + demo scores
    const novelty = artifact.technical.notes.match(/breakthrough|first|novel|prototype/i) ? 0.8 : 0.6;
    const impact = artifact.market.notes.match(/high|partnership|funding|tvl|contract|ppa|approval/i) ? 0.75 : 0.6;

    const { error: rErr, data: rData } = await sb.from("receipts")
      .update({ cid, novelty_score: novelty, impact_score: impact })
      .eq("hash", receipt_hash)
      .select("id");
    if (rErr) { miss++; console.error("Receipt update failed:", title, rErr.message); continue; }

    console.log(`✔ ${title} → ${cid} (linked receipts: ${rData?.length || 0})`);
    ok++;
  }

  console.log(`\nDone. Success: ${ok}, Failed: ${miss}`);
}

main().catch(e => { console.error(e); process.exit(1); });
