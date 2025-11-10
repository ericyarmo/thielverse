// scripts/seed_receipts_from_csv.ts
import fs from "node:fs";
import { parse } from "csv-parse/sync";
import 'dotenv/config';  
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

type Row = {
  ["Title"]: string;
  ["Source / Link"]: string;
  ["Date (YYYY-MM)"]?: string;
  ["Date"]?: string; // tolerate alt header
  ["Frontier"]: string;
  ["Entities (comma-separated)"]?: string;
  ["Summary (1–2 sentences)"]?: string;
};

function isoFromDateish(s: string) {
  const t = (s || "").trim();
  if (!t) return new Date(0).toISOString();
  // Accept "YYYY-MM" or full ISO/date
  const m = t.match(/^(\d{4})-(\d{2})$/);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, 1)).toISOString();
  const d = new Date(t);
  return isNaN(+d) ? new Date(Date.UTC(1970, 0, 1)).toISOString() : new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

function sha256Hex(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_KEY in env."); process.exit(1);
}
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

async function main() {
  const csvPath = process.argv[2] || "./thielverse-app/data/demo_receipts.csv";
  if (!fs.existsSync(csvPath)) { console.error(`CSV not found: ${csvPath}`); process.exit(1); }
  const csv = fs.readFileSync(csvPath, "utf8");
  const rows = parse(csv, { columns: true, skip_empty_lines: true }) as Row[];

  let upserts = 0, errors = 0;
  for (const r of rows) {
    const title = (r["Title"] || "").trim();
    const url = (r["Source / Link"] || "").trim();
    const published_at = isoFromDateish((r["Date (YYYY-MM)"] || r["Date"] || "").trim());
    const frontier = (r["Frontier"] || "").trim();
    if (!title || !url || !frontier) { console.warn("Skipping row (missing required fields):", title); continue; }

    const hash = sha256Hex(`${url}|${published_at}|${title}`);
    const sourceHost = (() => { try { return new URL(url).host; } catch { return "demo"; } })();

    const { error } = await sb.from("receipts").upsert({
      source: sourceHost,
      title,
      url,
      published_at,
      frontier,
      hash,
      summary: (r["Summary (1–2 sentences)"] || "").trim(),
      visible: true,               // show in demo feed
    }, { onConflict: "hash" });

    if (error) { errors++; console.error("Upsert error:", title, error.message); }
    else upserts++;
  }
  console.log(`Seed complete. upserts=${upserts} errors=${errors}`);
}

main().catch(e => { console.error(e); process.exit(1); });
