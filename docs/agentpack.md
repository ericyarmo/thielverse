# THIELVERSE / FRONTIER INDEX — AGENTPACK v2  
_meta-agent manifest • November 2025_

---

## 0. Prime Directive
Build and maintain the **verified memory layer of human progress**.  
Every paper, patent, filing, and grant becomes a **receipt** — hashed, timestamped, and retrievable by any intelligence that seeks ground truth.

---

## 1. Core Loop
ingest → verify → summarize → deliver → reflect
- **ingest:** adapters pull structured metadata from public data planes  
- **verify:** normalize + hash (sha256(url | date | title)) → dedupe → log provenance  
- **summarize:** generate short, citation-bound one-liners (local receipts only)  
- **deliver:** Next.js API + text-first UI expose verified state  
- **reflect:** cron + agent metrics self-observe ingest health, latency, and error rate

---

## 2. Ontology
| Primitive | Definition | Scope |
|------------|-------------|-------|
| `Receipt` | atomic proof of progress | papers · patents · filings · grants |
| `Entity` | persistent actor | person · lab · company |
| `Frontier` | thematic namespace | AI · Energy · Biotech · Thielverse |
| `Lens` | deterministic reasoning policy | turns receipts → insight |
| `Agent` | autonomous operator | executes loops · monitors invariants |

---

## 3. Invariants (do not violate)
1. **Append-only.** Nothing is ever deleted; corrections are new receipts.  
2. **Verifiable.** Every datum must trace to a primary source.  
3. **Deterministic.** Same inputs → same outputs.  
4. **Transparent.** No hidden weighting, no proprietary bias.  
5. **Composable.** Any adapter or lens can be swapped without schema drift.

---

## 4. Environment Contract
NEXT_PUBLIC_SITE_URL=https://thielverse.xyz
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=... # server only
OPENAI_API_KEY=... # optional
DEMO_DELAY_DAYS=7
BRAND_NAME=Frontier Index
All writes occur server-side using `SUPABASE_SERVICE_KEY`.  
No client exposure — ever.

---

## 5. System Map
[Adapters] → [Normalizer + Hasher] → [Supabase DB]
↓
[Next.js API Routes]
↓
[UI + Cron + Agent]
Data flows one way; time moves forward; the agent observes itself.

---

## 6. File Tree (canonical)
thielverse/
├─ apps/web/
│ ├─ src/app/{page.tsx, entity/[slug]/page.tsx, brief/page.tsx, enterprise/page.tsx}
│ ├─ src/app/api/{receipts, entities, ask, brief, cron}/…
│ ├─ src/lib/{supa.ts, time.ts, types.ts}
│ └─ src/components/*
├─ adapters/{openalex.ts, uspto.ts, sec.ts, README.md}
├─ db/{schema.sql, seeds.sql, bulk_seed.sql}
├─ scripts/{csv_to_sql.ts, make_brief.ts}
└─ docs/{agentpack.md, adr/*}

---

## 7. Agent Behaviors
| Behavior | Trigger | Output |
|-----------|----------|--------|
| `promote_visible` | 1-min cron | flips 2–3 receipts to visible |
| `openalex_pull` | 15-min cron | inserts 1–3 fresh OpenAlex works |
| `self_check` | manual / 6 h | curl all /api/* endpoints, log latency |
| `reflect` | deploy event | commit changelog + metrics snapshot |

---

## 8. Interaction Surfaces
- **Home / Feed:** live counter + filters + 7-day banner  
- **Entity:** linked receipts, metrics, Ask box  
- **Brief:** daily digest  
- **Enterprise:** API examples + pricing  
- **About:** who pays + source map  

_All pages load < 2 s; all data backed by receipts._

---

## 9. Health Probes
curl /api/health
curl /api/receipts/latest
curl /api/entities/helion-energy
If any fail → agent logs incident, retries with exponential backoff, posts alert to #ops.

---

## 10. QA Heuristics
- home loads < 2 s; counter ticks ≤ 90 s  
- ≥ 200 visible receipts; no 404s in top 20  
- ask returns `[R1][R2]` citations  
- /api/* endpoints return JSON arrays  
- mobile readable; all actions reversible  

---

## 11. Changelog Protocol
Every change = one-line commit:
docs(agentpack): +lens PolicySkeptic template v1
Changelog lives at end of this file with timestamp + signature.

---

## 12. Known Risks
- cron drift → client fallback promoter  
- LLM key missing → cached canned answers  
- source 404s → replace within 24 h  
- RLS misconfig → fail closed, never open

---

## 13. Mantras
> **Receipts in, bias out.**  
> **Speed is trust.**  
> **Every row a receipt, every receipt a proof.**

---

## 14. Changelog
2025-11-07 - began real ingestion today.
Local: dark Tailwind skin functional
Prod: serving legacy layout (SSR style)
Cause: likely missing / unbuilt `globals.css` or stale `.next/` build on Vercel
Fix plan: ensure tailwind config + globals.css deployed, run `npm run build && npm run start` locally to confirm parity
feat(ui): dark theme + table polish
feat(api): /stats live counter
feat(data): seed 20 real receipts via RSS adapter
docs: add running ingest script + env notes
2025-11-06 — v2 rewritten as meta-agent manifest.  
Agent self-description complete; ready for autonomous build loop.
build: add supabase client + tsx; begin receipts API
feat(api): /api/receipts/latest + env, schema, supabase client; add vercel crons scaffold
db: fix policy check (policyname), keep schema idempotent; add receipts.frontier.
db: add receipts.visible + backfill; fix receipts endpoint error.
db: seed entities + link demo receipt; add rpc frontier_counts
feat(api): /api/entities/[slug]; /api/brief
fix(api): rewrite /api/entities/[slug] to 3-step (entity→ids→receipts); remove brittle join
feat(api): safe /api/brief (counts + latest per frontier; no RPC dependency)
feat(ui): home feed + entity page
feat(api): cron/promote + cron/openalex
db: normalize frontier casing for brief (Energy)
fix(ui): unwrap Next 15 searchParams Promise on /
feat(ui): AskBox hitting /api/ask for live, no-LLM summaries