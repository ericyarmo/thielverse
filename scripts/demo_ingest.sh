#!/usr/bin/env bash
# Usage: ./scripts/demo_ingest.sh ./thielverse-app/data/demo_receipts.csv
set -euo pipefail

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

CSV="${1:-}"
if [[ -z "$CSV" || ! -f "$CSV" ]]; then
  echo "Usage: $0 /path/to/demo_receipts.csv"; exit 1
fi


: "${SUPABASE_URL:?Set SUPABASE_URL in your env (or .env.local)}"
: "${SUPABASE_SERVICE_KEY:?Set SUPABASE_SERVICE_KEY in your env (or .env.local)}"
: "${SUPABASE_BUCKET_ANALYSES:=analyses}"

echo "→ Seeding receipts from $CSV"
npx tsx scripts/seed_receipts_from_csv.ts "$CSV"

echo "→ Generating & uploading analyses for rows missing CID"
npx tsx scripts/generate_and_upload_analyses_simple.ts "$CSV"

echo "→ Verifying counts and grabbing a sample CID"
npx tsx scripts/verify_and_pick_cid.ts

CID="$(node -e "require('fs').readFileSync('.tmp_cid','utf8').trim()" 2>/dev/null || true)"
if [[ -n "$CID" ]]; then
  echo "→ Hitting local API for $CID"
  curl -s "http://localhost:3000/api/analysis/$CID" | jq '.meta.title,.receipt_hash' || true
else
  echo "No CID found to test."
fi

echo "✓ Done."
