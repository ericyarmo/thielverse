# Thielverse / Frontier Index — YC Demo PRD (v4)
_mode: 72-hour demo • site: thielverse.xyz_

---

## 0) Demo Promise
**We index the receipts of human progress** — papers, patents, filings, grants — into a **verified, searchable memory**.  
The demo proves the loop end-to-end: **ingest → verify → deliver** (summaries optional/cached).
 
**Definition of “Done”**
- Home feed < 2 s; counter visibly moves ≤ 90 s.
- `/entity/helion-energy` renders with timeline + canned Ask (citations syntax).
- JSON endpoints live: `/api/receipts/latest`, `/api/entities/:slug`, `/api/brief`.
- Vercel Cron reveals new rows; OpenAlex trickles live.
- Public mode enforces **7-day delay**; no service key in client.

---

## 1) Viewer Experience (what YC sees in 90 seconds)
- **Home / Feed**: a ticking counter and fresh rows fading in; filters for **AI / Energy / Biotech / Thielverse**.
- **Entity: Helion Energy**: tight timeline, 4 mini-metrics, Ask returns a cached, cited blurb.
- **Brief**: compact daily digest (4 frontiers), “Send me daily (demo)”.
- **Enterprise**: simple API examples + pricing + 7-day vs real-time visual.
- **About**: “Who pays” table and ethos line: *receipts-in • bias-out*.

Motion feels real; anything mocked is clearly labeled “demo”.

---

## 2) Scope Map (works vs mocked)
| Feature | Works? | Purpose |
|---|---|---|
| Live Feed (home) | ✅ real | Prove ingestion + visibility loop |
| Counter & motion | ✅ real (cron + drift) | Make “alive” obvious |
| Filters (frontier) | ✅ real | Show breadth |
| Entity: Helion | ✅ partial | Demonstrate depth on one entity |
| Ask box | ⚙️ canned | Reveal reasoning shape, not model |
| Expert quotes | ⚙️ static | Context without cost |
| Subscribe | ⚙️ fake modal | Show retention path |
| Frontier Brief | ✅ static + dynamic titles | UX surface |
| Enterprise page | ✅ static + curl examples | Business model |
| 7-day delay toggle | ✅ visual | Communicate access tiers |
| API JSON | ✅ real | Dev credibility |

---

## 3) Data Plan
**Seed**
- ~600 receipts total (70% real OpenAlex, 30% curated/hand-picked), evenly across the four frontiers.
- All seed rows start `visible=false`.

**Live Motion**
- Cron flips **3 receipts** to `visible=true` every minute.
- OpenAlex cron inserts **1–3** fresh works every 15 minutes (Energy keywords to support Helion focus).

**Entity Depth**
- `helion-energy`: ≥20 real receipts (OpenAlex/SEC/USPTO links seeded); rest are thin placeholders.

---

## 4) Surfaces & Copy (canonical)
### 4.1 Home — “Frontier Feed”
1,284,502 receipts indexed • updated 3m 42s ago
sources: [OpenAlex] [USPTO] [SEC] [DOE] [ARPA-E]
frontiers: [AI] [Energy] [Biotech] [Thielverse]
Table: **date | source | title | hash**  
Row click: external source link.  
Hash click: mini-modal “Verified: OpenAlex • 2025-11-06 12:04 UTC”.

### 4.2 Entity — `/entity/helion-energy`
Header: **Helion Energy — receipts across the nuclear frontier**  
Mini-metrics (rule-of-thumb):
- Technical ↑ (OpenAlex + USPTO, 90d)
- Funding ↑↑ (SEC Form D presence, 180d)
- Regulation ↔ (DOE/ARPA-E/EIS, 180d)
- Sentiment ↓ (placeholder)

Timeline: 15 recent receipts (color = source).  
Ask: “Explain Helion’s 2025 progress.” → cached 3–5 sentences with `[R1][R2]`.

### 4.3 Brief — `/brief`
Frontier Daily — {today}
{N} receipts indexed (+{Δ} vs yesterday)

AI — "Sparse Autoencoders..." [#09f3]
Energy — "Helion — Form D $25M" [#4b7e]
Biotech — "CRISPR Enhancement..." [#7c2d]
Thielverse — "OpenAI Board Filing" [#a1e4]
Button: “Send me this daily (demo).”

### 4.4 Enterprise — `/enterprise`
**Verified Receipts API — normalized, hashed, ready for agents.**  
cURL:
Button: “Send me this daily (demo).”

### 4.4 Enterprise — `/enterprise`
**Verified Receipts API — normalized, hashed, ready for agents.**  
cURL:
curl "https://thielverse.xyz/api/receipts/latest?frontier=Energy&limit=25"
Pricing bullets:
- Free (public, 7-day delay)
- Pro $5/mo (real-time)
- Team $50/seat
- Enterprise $25k+/yr

### 4.5 About — `/about`
“Who pays” table: **Ventures, Gov/R&D, Investors, Media, Individuals**.  
Footer line: **1 billion receipts • 1 year • open verifiable alive.**

---

## 5) APIs (demo surface)
Base: `https://thielverse.xyz`
GET /api/receipts/latest?frontier={AI|Energy|Biotech|Thielverse}&limit=50
GET /api/entities/:slug
POST /api/ask
GET /api/brief
GET /api/health
Public mode enforces **7-day delay** at read-time; Pro removes it (identical endpoints).

---

## 6) Timeline (human-readable)
| Day | Focus | What happens |
|---|---|---|
| 1 | Base + Feed | Supabase schema/seed, home table + counter, deploy to Vercel |
| 2 | Entity + Motion | Helion page + Ask (canned), crons for promote/OpenAlex |
| 3 | Brief + Enterprise + Polish | Brief view, pricing page, copy, mobile QA, link scrub |

---

## 7) Quality Targets (demo)
- Page load < 2 s
- Counter moves ≤ 60–90 s
- ≥ 200 visible receipts
- No 404s in top 20 links
- Ask returns text with `[R#]`
- JSON endpoints return valid arrays
- Mobile readable, no horizontal scroll

---

## 8) Demo Script (3–4 minutes)
1. **Open Home** — “See the counter? It moves because verified receipts are being revealed; public is 7-day delayed.”  
2. **Filter Energy** — “Notice the hash column — every row is a verifiable receipt.”  
3. **Open a hash modal** — “Source and timestamp; we store metadata + link, not full text.”  
4. **Jump to Helion** — “Depth on one entity: timeline, tiny metrics, Ask with citations.”  
5. **Brief page** — “This is how daily memory looks when condensed.”  
6. **Enterprise** — “Same data, clean JSON. Free is delayed; Pro/Enterprise is real-time.”  
7. **Close** — “Receipts-in, bias-out. Deterministic memory → better agents.”

---

## 9) Risks & Cut-Scope
- **Cron drift** → one-shot client fallback to `/api/cron/promote`.  
- **OpenAlex hiccups** → keep ≥ 200 seeded rows; show motion from promoter.  
- **LLM key missing** → Ask uses cached canned text.  
- **Link rot in top 20** → manual replace via Supabase editor pre-demo.

If behind: drop Biotech; keep AI/Energy/Thielverse. Brief can be static JSON.

---

## 10) Narratives (one-liners)
- **What we built:** the verified memory layer of human progress.  
- **What’s real:** live ingestion, verifiable rows, public/pro delay modes, working JSON.  
- **Why it matters:** agents need receipts, not vibes.  
- **Why now:** open data matured; verification is the missing substrate.  
- **Why us:** we ship fast, with append-only discipline and clean contracts.  
- **Next 90 days:** add SEC/USPTO adapters, Pro accounts, briefs email, 3 enterprise pilots.

---

## 11) Appendix (operator crumbs)
- Health probes to show:  
  `curl /api/health`, `curl /api/receipts/latest?limit=5`, `curl /api/entities/helion-energy`
- Public banner copy: **“Public memory is delayed 7 days. Real-time for Pro & Enterprise.”**
- Ethos footer: **receipts-in • bias-out © Frontier Index**
