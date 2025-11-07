## 1) Executive Summary

### 1.1 Purpose
Thielverse / Frontier Index is a verified-intelligence network that transforms public data—papers, patents, filings, and grants—into a **verifiable, queryable memory**.  
Each artifact becomes a *receipt of progress*: a normalized, hashed, and timestamped record that can be referenced by humans or language models with deterministic provenance.  
The system exposes structured metadata, cryptographic hashes, and compressed summaries optimized for reproducible reasoning and longitudinal analysis.  
Its design goal is simple: turn the open web’s noise and fragmentation into verifiable memory that scales.

### 1.2 Origin Context — YC Sprint
The initial system was built during a **72-hour YC application sprint** in November 2025.  
Eric Yarmo and Alex Solomon produced a live demo proving that a verified intelligence network could be prototyped end-to-end using public datasets and modern web infrastructure:  
Supabase for verifiable storage, Next.js for delivery, and adapters to fetch receipts from OpenAlex, USPTO, and SEC APIs.  
This document expands that prototype into the founding technical architecture for a billion-receipt network.  
It records how the prototype evolved into a system spec—concise enough to be parsed by an LLM, precise enough to be implemented by engineers.

### 1.3 Why Verified Memory Matters
Large language models operate probabilistically; they hallucinate when inputs lack fixed ground truth.  
A verifiable receipt layer provides that missing substrate: a global index of timestamped, hashable facts with transparent provenance.  
When each claim or summary can reference immutable receipts, models become auditable, reproducible, and less biased by omission.  
Verified memory is not a feature—it’s the **precondition for reliable machine reasoning**.  
As more systems depend on synthetic intelligence, a canonical record of real progress becomes inevitable.  
Thielverse / Frontier Index exists to build that record.

## 2) System Overview

### 2.1 Core Loop — *Ingest → Verify → Summarize → Deliver*
The system runs a deterministic loop:
1) **Ingest:** adapters pull structured metadata from authoritative sources (OpenAlex, USPTO, SEC, DOE/ARPA-E).  
2) **Verify:** normalizers standardize fields, compute `sha256(url|published_at|title)`, dedupe, attach provenance.  
3) **Summarize:** lens functions produce short, cached one-liners that cite only verified receipts.  
4) **Deliver:** Next.js API routes and a text-first UI expose structured data and summaries.

### 2.2 Key Entities
- **Receipt:** atomic, time-stamped evidence (paper, patent, filing, grant).  
- **Entity:** organization, lab, or person linked to many receipts.  
- **Lens:** deterministic prompt + rubric; reasoning constrained to local receipts.

### 2.3 Stack Diagram
one liner: Adapters → Normalizer+Hasher → Postgres → API → UI (+Cron) → Cached LLM (optional)
               ┌───────────────────────────┐
               │         Users / Bots      │
               └───────────────┬───────────┘
                               │
                               ▼
   ┌───────────────────────────────────────────────────────────┐
   │                       Adapters (server)                   │
   │  OpenAlex  |  USPTO  |  SEC  |  DOE / ARPA-E  |  (more)   │
   └────────────┬─────────┬───────┬───────────────┬───────────┘
                │         │       │               │
                ▼         ▼       ▼               ▼
          ┌────────────────────────────────────────────┐
          │        Normalizer  +  Hasher (sha256)      │
          └───────────────┬────────────────────────────┘
                          │
                          ▼
                 ┌───────────────────────┐
                 │   Supabase / Postgres │
                 │ receipts / entities   │
                 │ entity_receipt links  │
                 └───────────┬───────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Next.js API     │
                    │  (server routes) │
                    └────────┬─────────┘
                             │
                             ▼
         ┌───────────────────────────────┐
         │  UI (Next.js) + Vercel Cron  │
         │  + Cached LLM (optional)     │
         └───────────────────────────────┘


### 2.4 End-to-End Flow (Adapter → Ask)
[Adapter Fetch]
      │
      ▼
[Normalize] → [Hash_v1] → [Upsert (idempotent)] → [Link to Entities]
      │                                        │
      └─────────── metrics / logs ─────────────┘

[Promoter → visible=true] → [Materialized View refresh] → [API: /receipts/latest]
                                                             │
                                                             └→ [Ask: load receipts]
                                                                  → [Apply Lens prompt]
                                                                  → [Cache answer + citations]


### 2.5 Non-Goals (Demo Scope)
- No long-form content mirroring (metadata + link only).  
- No human reputation scoring.  
- No private dataset ingestion without Enterprise contract.  
- No destructive deletes; edits expressed as new receipts.

### 2.6 Observability
- **ingest_latency_ms:** time from adapter fetch → DB commit. Target: < 2000 ms.
- **dedupe_hit_rate:** percent of incoming receipts already present. Target: > 90% steady state.
- **adapter_http_error_rate:** upstream failures. Target: < 1%.
- **ask_cache_hit_rate:** percent of lens answers served from cache. Target: > 70%.
- **receipt_promotions_per_min:** receipts flipping to `visible=true`. Target: > 50/min steady state.
- **p99_api_latency_ms:** 99th percentile API response time. Target: < 1200 ms.

**Dashboards:** Grafana panels for Ingest, API, Cache, DB Health.  
**Alerts:** error rate > 2% (5-min), promotion stall > 3 min, p99 latency > 1200 ms.


## 3) Data Layer — “Receipts”

### 3.1 Data Definition & Schema

```ts
// Data contract (public)
export type Receipt = {
  id: string;                 // uuid
  source: string;             // 'OpenAlex'|'USPTO'|'SEC'|'DOE'|'ARPA-E'|...
  title: string;
  url: string;                // canonical source link
  published_at: string;       // ISO date/time
  frontier?: 'AI'|'Energy'|'Biotech'|'Crypto'|'Thielverse';
  hash: string;               // sha256(url|published_at|title)
  summary?: string;           // 1-liner (optional)
  visible: boolean;           // promotion gate for feed
  created_at: string;         // server timestamp
};
```

Postgres tables:

* `receipts(id, source, title, url, published_at, frontier, hash unique, summary, visible, created_at)`
* `entities(id, slug unique, name, kind, profile)`
* `entity_receipt(entity_id, receipt_id, role, primary key(entity_id, receipt_id))`

Indexes: `(published_at desc)`, `(frontier)`, `(slug)`.  
RLS: read-only on all three tables; **all writes are server-side** with a service role.

### 3.2 Source Types

* **OpenAlex:** peer-reviewed literature and preprints; rich metadata and links.
* **USPTO:** patents and applications (grants signal technical depth).
* **SEC:** Forms D/8-K/S-1/13D etc. (funding and governance signals).
* **DOE / ARPA-E / EIS:** grants, solicitations, environmental filings (regulatory signal).
* Additional: NIH RePORTER, CORDIS, arXiv, Crossref (future adapters).

### 3.3 Normalization & Hashing (v1)

```
hash_v1 = sha256("tvfi:v1|" + canonical_url + "|" + published_at_iso + "|" + title_trimmed)
```

* **Normalization:** trim whitespace, normalize capitalization, coerce dates to UTC ISO, canonicalize URLs.  
* **Hash:** `sha256(url | '|' | published_at | '|' | title)` — used for idempotent upserts and de-duplication across sources.  
* **On conflict:** update only mutable fields (`summary`, `frontier`, `visible`); do not rewrite `title`, `url`, `published_at`.  
* **Collision handling:** unique constraint on `hash`; future versions can introduce `hash_v2` without breaking v1 rows.

**Receipt.v1.json**

```json
{
  "type": "object",
  "required": ["id", "source", "title", "url", "published_at", "hash", "visible", "created_at"],
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "source": { "type": "string", "enum": ["OpenAlex", "USPTO", "SEC", "DOE", "ARPA-E"] },
    "title": { "type": "string" },
    "url": { "type": "string", "format": "uri" },
    "published_at": { "type": "string", "format": "date-time" },
    "frontier": { "type": "string", "enum": ["AI", "Energy", "Biotech", "Crypto", "Thielverse"] },
    "hash": { "type": "string", "pattern": "^[a-f0-9]{64}$" },
    "summary": { "type": "string" },
    "visible": { "type": "boolean" },
    "created_at": { "type": "string", "format": "date-time" }
  }
}
```

### 3.4 Append-Only & Audit Guarantees

* **Append-only intent:** never mutate the meaning of a receipt; only **append** new receipts or **promote** visibility.  
* **Audit:** store `created_at`; retain prior summaries by writing a new summary receipt (future: `receipt_versions`).  
* **No full-text mirroring:** store metadata + links only; avoid copyright liabilities.

### 3.5 Storage, Deduping, and Visibility Promotion

* **Storage:** Postgres on Supabase; S3-compatible object storage for optional cached JSON blobs.  
* **Deduping:** upsert by `hash` with `ON CONFLICT (hash) DO UPDATE SET summary/frontier/visible`.  
* **Promotion:** background promoter flips `visible=false → true` on a schedule; UI respects `visible=true` + delay windows.  
* **Operational targets:** insert p95 < 2 s (fetch→commit); dedupe hit-rate > 90 %; metadata-only storage ≈ 1 KB/receipt.

## 4) Verification Layer — “Memory”

### 4.1 Integrity Pipeline (numbered)
1) **Fetch** — adapters request authoritative source endpoints (OpenAlex/USPTO/SEC/DOE/ARPA-E).  
2) **Normalize** — sanitize + canonicalize fields (URL, title, date → UTC ISO).  
3) **Hash** — compute `hash_v1 = sha256("tvfi:v1|" + canonical_url + "|" + published_at_iso + "|" + title_trimmed)`.  
4) **Upsert (idempotent)** — `ON CONFLICT (hash)` update only mutable fields (`summary`, `frontier`, `visible`).  
5) **Link** — create `entity_receipt` edges via deterministic heuristics (domain maps, name/assignee rules, cached lookups).  
6) **Promote** — set `visible=true` when freshness rules allow (see delay modes).  
7) **Emit telemetry** — `{request_id, adapter, fetched, inserted, deduped, errors[]}` stored for audit.

**Guarantees**
- Pipeline is **append-intent**: semantics never overwritten; new info appended.  
- All writes occur server-side with service role; RLS enforces public read-only.

---

### 4.2 Freshness Modes (Public / Pro / Enterprise)
- **Public:** UI and API enforce a **7-day delay** on reads. Query includes `WHERE published_at <= now() - interval '7 days'`.  
- **Pro:** **real-time** reads (`delay=0`). Same API surface; token controls mode.  
- **Enterprise:** configurable window (`N` hours/days), private indexes, SLA.

**Implementation**
- Delay is enforced **server-side** in API handlers (cannot be bypassed by clients).  
- Promoter flips `visible` on a schedule for UI motion, but *mode* gating happens at read time.  
- Tokens: short-lived JWT (1h TTL) with scopes: `read:public`, `read:pro`, `read:enterprise`.

---

### 4.3 RLS & Write Safety
- **RLS policies:** public `SELECT` on `receipts`, `entities`, `entity_receipt`. No public `INSERT/UPDATE/DELETE`.  
- **Service role writes:** adapters and promoters run in API routes with `SUPABASE_SERVICE_KEY`.  
- **Immutable fields:** `title`, `url`, `published_at`, `source` are treated as immutable at the application layer.  
- **Mutable fields:** `summary`, `frontier`, `visible` can be updated via `ON CONFLICT` rules.

---

### 4.4 Reconciliation & Nullification Receipts
Upstream sources change (withdrawals, merges, corrected metadata). We **do not** destructively edit prior receipts.  
We reconcile via **nullification receipts** and annotations:

- **Nullification receipt:** a new receipt that references `original_hash` and encodes the upstream correction (withdrawn, superseded, merged).  
- **Weekly reconciliation:** adapters re-check recent windows (e.g., last 30–90 days) using `etag/last-modified` headers or source-specific diffs.  
- **Conflict outcomes:**
  - Metadata correction → write a *correction note* as a secondary receipt; retain original.  
  - Withdrawal → write a *withdrawal* nullification receipt.  
  - Duplicate upstream IDs → canonicalize in linking layer, never rewrite original receipt.

This approach preserves a causal trail without compromising immutability or auditability.

---

### 4.5 Optional Daily Hash Chains (lightweight audit)
For compact audit proofs per frontier/day:

```
chain[0] = GENESIS
chain[n] = sha256(chain[n-1] + receipt_hash[n])
```

- **Scope:** computed per `{frontier, YYYY-MM-DD}` over receipts with `visible=true`.  
- **Storage:** persisted in `audit_chain(frontier, day, chain_tail, count)`.  
- **Use:** quick integrity checks, external attestations, partner sync diffs.  
- **Note:** this is *not* a blockchain; it’s a lightweight tamper-evidence mechanism layered over append-only semantics.


## 5) Intelligence Layer — “Lenses”

### 5.1 Concept
A **Lens** is a deterministic reasoning policy: a named prompt + rubric that consumes only local receipts and emits short, citation-bound outputs.  
Lenses run server-side, with strict input shaping, output length limits, and budget caps.  
If the input set is insufficient, the lens must return **“Not enough receipts.”**

---

### 5.2 Lens Library (v0)

| Lens | Purpose | Inputs (minimal) | Output form |
|---|---|---|---|
| **Contrarian Builder** | Down-weights press; up-weights patents/grants. | last 6–12 mo receipts, types: USPTO/DOE/ARPA-E/OpenAlex | 4 sentences, each cites ≥1 `[R#]` |
| **Engineer Realist** | Surfaces technical progress and bottlenecks. | last 12 mo receipts, emphasis: OpenAlex/USPTO | 5 sentences with `[R#]` |
| **Policy Skeptic** | Cross-checks regulation vs claims. | last 12 mo, DOE/EIS/SEC vs press | 3–4 sentences with `[R#]` |
| **Market Mapper** | Maps funding/partnerships. | SEC + press releases subset | 4 bullets with `[R#]` |
| **Risk Officer** | Lists top 3 execution risks. | full entity receipts window | 3 bullets with `[R#]` |

Notes: Lenses are **simulations**; they do not represent live human views (see §9).

---

### 5.3 Prompt Template (deterministic)

```txt
You are the {lens_name} lens.
Use only the local receipts provided below. Do not invent facts.
If receipts are insufficient, reply exactly: "Not enough receipts."

Rules:
- Cite at least one [R#] token per sentence/bullet, where R# maps to the provided list.
- Keep within {max_sentences_or_bullets}.
- Prefer primary receipts in this order: USPTO/DOE/ARPA-E > SEC > OpenAlex > press.
- No subjective adjectives; state evidence and linkages only.

Inputs:
- Entity: {entity_slug}
- Window: {lookback_window}
- Receipts:
  R1: {title_1} ({source_1}, {date_1}) <{url_1}>
  R2: {title_2} ({source_2}, {date_2}) <{url_2}>
  ...
  Rn: {title_n} ({source_n}, {date_n}) <{url_n}>

Output:
{format_spec_for_lens}
```

Determinism levers:
- Fixed ordering of receipts (stable sort by `published_at asc, hash asc`).  
- Fixed prompt scaffolding and output format per lens.  
- No temperature or sampling (greedy decode).

---

### 5.4 Caching, Keys, and Cost Controls

**Cache key**
```
cache_key = sha256(JSON.stringify({
  lens: lens_name,
  entity: entity_slug,
  window: lookback_window,
  receipts: receipts.map(r => [r.hash, r.published_at]),
  prompt: template_version_id,
  q: user_question || null
}))
```

**Policy**
- Default serve from cache; recompute only when:
  - new receipt with `published_at` inside window,
  - template_version_id increments,
  - user_question changes (Ask path).
- TTL: 24h for briefs; 6h for Ask; manual bust on adapter changes.

**Cost controls**
- Per-request hard cap (tokens/time); per-day per-user budget.  
- LLM selection matrix:
  - Digest/briefs → small model.  
  - Ask (cold) → mid/large model with guardrails.  
- Back-pressure: queue with concurrency limits; circuit-breaker on upstream errors.

---

### 5.5 QA Policy (determinism & hallucinations)

**Determinism**
- Same inputs → byte-identical output; we assert `sha256(output)` stability in tests.  
- Stable sorting + fixed prompt + greedy decode = deterministic pipeline.

**Citation requirement**
- 100% of sentences/bullets must include ≥1 `[R#]`.  
- If no receipts provided or mapping fails → output must be **“Not enough receipts.”**

**Hallucination rate**
- Target = **0%**. Any off-receipt claim is a test failure.

**Red-team & regression**
- Weekly adversarial prompts per lens; failures become unit tests.  
- Coverage includes empty-window, high-duplication, conflicting-receipt scenarios.

**Monitoring**
- `ask_cache_hit_rate`, `lens_hallucination_incidents`, `determinism_failures`, `p95_decode_ms`.  
- Alerts on any hallucination incident; auto-disable offending lens template pending review.


## 6) Interface Layer — “The Board”

### 6.1 Feed + Counter Mechanics
The **Board** is the user’s first view into verified memory — a streaming table of receipts rendered in reverse chronological order.  
It exposes motion, not opinion.

**Feed behavior**
- Each row displays `date | source | title | hash`.  
- Rows fade in as the promoter flips `visible=true`.  
- Filters: `?frontier=AI`, `?frontier=Energy`, etc.  
- `GET /api/receipts/latest` returns ≤50 receipts ordered by `published_at desc`.  
- Pagination: cursor-based on `published_at` and `hash`.

**Counter**
```
visible_count = SELECT COUNT(*) FROM receipts WHERE visible=true
live_counter = visible_count + estimated_drift + live_inserts
```
- The counter updates every 60–90 s via Vercel Cron or fallback polling.  
- Drift simulates ongoing ingestion between refreshes.  
- The counter is public; it signals growth, not exact count.

---

### 6.2 Entity Pages
Each **Entity Page** aggregates receipts for a person, organization, or lab.

**Layout**
- Header: entity name, type, and total receipts count.  
- Metrics bar:  
  - *Technical*: OpenAlex + USPTO 90 d window  
  - *Funding*: SEC Form D presence 180 d  
  - *Regulatory*: DOE / ARPA-E / EIS 180 d  
  - *Sentiment*: placeholder (manual input, future NLP)
- Timeline: 15 most recent receipts.  
- Ask box: user enters a query (e.g., “funding progress last 6 months”).  
  - `POST /api/ask { entity, q }` returns cached answer with `[R1][R2]` citations.  
  - Cached responses expire on new receipts or template version bump.

**Example**
```
/entity/helion-energy
```
Shows live receipts from OpenAlex, USPTO, SEC, and DOE sources, plus an Ask box bound to the “Engineer Realist” lens.

---

### 6.3 Briefs, Email, and Slack Bots
**Briefs**
- `/brief` renders a daily digest preview (four frontiers: AI, Energy, Biotech, Thielverse).  
- “Send me daily” button opens modal; production flow integrates **Resend API** for emails.  
- Digest uses cached lens summaries; 24 h TTL.

**Slack Bot**
- Prototype command format:  
  ```
  /frontier ask helion-energy funding last 6m
  ```
- Bot uses the same API endpoints as the web app.  
- Future: Slack SDK integration with ephemeral thread replies, workspace-scoped tokens, and analytics hooks.

---

### 6.4 UX Philosophy — Text-First Minimalism
The UI is intentionally austere: **text-first, monochrome, sub-200 ms render**.  
It avoids brand noise; typography and whitespace carry hierarchy.  

Principles:
- No complex animations, gradients, or banners.  
- **Links > buttons**, **text > icons**, **evidence > emotion**.  
- Every view must load in under 2 s on median 4G.  
- All interactions are reversible, transparent, and explainable.

The Board serves the receipts — not the product.  
It exists to make provenance legible, speed tangible, and bias visible.

## 7) Enterprise & API Design

### 7.1 REST Endpoints & Data Contracts

**Base URL (demo):** `https://thielverse.xyz`

```http
GET  /api/receipts/latest?frontier={AI|Energy|Biotech|Crypto|Thielverse}&mode={public|pro}&cursor={ts_hash}&limit={1..50}
GET  /api/entities/:slug
POST /api/ask
GET  /api/brief
GET  /api/health
```

**Query params**
- `frontier` (optional): filter receipts by frontier.
- `mode` (optional): `public` (default, enforces delay) or `pro` (real-time, token required).
- `cursor` (optional): pagination cursor (`{published_at_ms}:{hash[:8]}`).
- `limit` (optional): max items; default 50; hard cap 50.

**Request / Response (shapes, abbreviated)**

```json
// GET /api/receipts/latest
{
  "data": [
    {
      "id": "uuid",
      "source": "OpenAlex",
      "title": "string",
      "url": "https://...",
      "published_at": "2025-11-01T12:34:56Z",
      "frontier": "Energy",
      "hash": "a3c9...e1",
      "summary": "optional one-liner",
      "visible": true,
      "created_at": "2025-11-01T12:35:01Z"
    }
  ],
  "next_cursor": "1730867696000:a3c9e1ab"
}
```

```json
// GET /api/entities/:slug
{
  "entity": { "id":"uuid", "slug":"helion-energy", "name":"Helion Energy", "kind":"org" },
  "receipts": [ /* latest N receipts for entity */ ]
}
```

```json
// POST /api/ask      (Content-Type: application/json)
{
  "entity": "helion-energy",
  "q": "funding progress in last 6 months",
  "mode": "public"       // or "pro"
}

// 200 OK
{
  "answer": "Short summary with [R1][R2].",
  "citations": ["R1","R2","R3"],
  "cache": { "hit": true, "key": "sha256(...)" }
}
```

```json
// GET /api/brief
{
  "as_of": "2025-11-06",
  "sections": {
    "AI": ["... [R4]"],
    "Energy": ["... [R2]"],
    "Biotech": ["... [R1]"],
    "Thielverse": ["... [R7]"]
  }
}
```

```json
// GET /api/health
{ "ok": true, "ingest_latency_ms_p95": 780, "api_p99_ms": 640 }
```

---

### 7.2 Authentication, Modes, Pagination, and Errors

**Auth (JWT)**
- Header: `Authorization: Bearer <token>`
- Token: short-lived JWT (TTL 1h), audience `thielverse-api`.
- Scopes:
  - `read:public` — default; 7-day delay enforced at read-time.
  - `read:pro` — real-time reads; identical endpoints, fewer restrictions.
  - `read:enterprise` — access to private indexes / higher limits.
- Rotation: `POST /api/auth/rotate` (enterprise only) issues new short-lived tokens.

**Delay modes**
- `public`: server-side filter `published_at <= now() - interval '7 days'`.
- `pro`: no delay; rate-limited by plan.
- `enterprise`: configurable delay window per-tenant.

**Pagination**
- Cursor format: `{published_at_ms}:{hash8}` (monotonic sort by time then hash).
- `next_cursor` returned when more pages exist.
- `limit` default 50, max 50 (higher for enterprise tenants).

**Errors (uniform JSON)**
```json
{
  "error": {
    "code": "RATE_LIMITED",     // or "UNAUTHORIZED" | "INVALID_INPUT" | "NOT_FOUND" | "UPSTREAM_ERROR"
    "message": "Too many requests.",
    "request_id": "01J4Z2Q2W1X8F4P..."
  }
}
```
- Always include `request_id` (UUIDv7) for audit.
- HTTP status aligns with `error.code` (e.g., 429 for RATE_LIMITED).

**Rate limits (demo)**
- `GET /api/receipts/latest`: 60 req/min/IP (public), 300 req/min/token (pro).
- `POST /api/ask`: 10 req/min/token (pro), 2 req/min/IP (public).
- Enterprise: negotiated ceilings and burst buffers.

---

### 7.3 Usage Examples

**cURL**
```bash
# Latest Energy receipts (public mode, delayed)
curl -s "https://thielverse.xyz/api/receipts/latest?frontier=Energy&limit=25"

# Entity details
curl -s "https://thielverse.xyz/api/entities/helion-energy"

# Ask (pro mode)
curl -s -X POST "https://thielverse.xyz/api/ask" \
  -H "Authorization: Bearer $TVFI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity":"helion-energy","q":"funding progress last 6 months","mode":"pro"}'
```

**Python**
```python
import os, requests

BASE = "https://thielverse.xyz"

# Latest receipts (public)
r = requests.get(f"{BASE}/api/receipts/latest", params={"frontier":"AI","limit":25})
r.raise_for_status()
data = r.json()["data"]

# Entity
e = requests.get(f"{BASE}/api/entities/helion-energy").json()

# Ask (pro)
headers = {"Authorization": f"Bearer {os.environ.get('TVFI_TOKEN')}",
           "Content-Type": "application/json"}
payload = {"entity":"helion-energy","q":"technical progress last 90d","mode":"pro"}
ans = requests.post(f"{BASE}/api/ask", headers=headers, json=payload).json()
print(ans["answer"])
```

**LLM Agent Tools (sketch)**
```json
[
  {"name":"get_receipts","description":"Fetch latest receipts","args":{"frontier":"string","mode":"public|pro","limit":"number","cursor":"string"}},
  {"name":"get_entity","description":"Fetch entity and latest receipts","args":{"slug":"string"}},
  {"name":"ask","description":"Ask via lens; citations required","args":{"entity":"string","q":"string","mode":"public|pro"}}
]
```

---

### 7.4 Partner Archetypes

- **Venture / Growth Equity** — pipeline triage, portfolio monitoring, competitor maps; private frontiers (e.g., robotics).  
- **Gov / R&D (DOE, NIH, EU)** — grant impact tracking, solicitation coverage, gap analysis; offline nodes and on-prem options.  
- **Media / Verification** — receipt-backed sourcing, rapid corrections, audit trails for investigative work.  
- **Funds & Family Offices** — periodic briefs, private indexes, custom lenses (risk-focused, regulatory-focused).

**Enterprise terms (typical)**
- Annual contract, per-seat or per-index pricing; SLAs for availability and freshness.  
- Higher rate limits, custom delay windows, private adapters, and priority support.  
- Optional: partner-hosted indexes with nightly signed merges (see §10.3).

## 8) Business Logic

### 8.1 Pricing Tiers

| Tier | Description | Features | Price |
|------|--------------|-----------|--------|
| **Free** | Public access with 7-day delay. | Feed, entity pages, JSON API. | $0 |
| **Pro** | Real-time access for individuals. | Instant feed, saved lenses, email/Slack briefs, API key. | $5 / month |
| **Team** | Shared accounts for research groups. | Shared notebooks, audit logs, higher rate limits, new adapter access. | $50 / seat / month |
| **Enterprise** | Private indexes + SLAs. | Real-time ingestion, custom lenses, private datasets, support. | from $25 000 / year |

**Add-ons**
- Extra adapters or frontiers — $500 – $2 000 / source / year  
- Dedicated LLM instance — $0.002 / 1 000 tokens  
- White-label dashboards — custom

---

### 8.2 Cost Drivers

| Driver | Description | Approx. Unit Cost |
|---------|-------------|------------------|
| **Compute (Adapters)** | Fetch / normalize / hash | $0.05 per 100 000 receipts |
| **Database / Storage** | Postgres + S3 metadata + logs | $0.01 per 100 000 receipts / month |
| **LLM Calls** | Summarization + Ask queries (cached) | $0.002 per 1 000 tokens |
| **Egress / Delivery** | CDN + email + Slack sends | $0.10 per GB |
| **Scheduler / Cron** | Vercel jobs + monitoring | $0.002 per run |

> Most workload is read-heavy and cacheable; ingestion and summarization account for < 10 % of total cost.

---

### 8.3 Unit Economics (demo model)

**Assumptions**
- 1 000 000 receipts ingested per month  
- 50 000 monthly active users  
- 5 % Pro (2 500 users), 1 % Team (500 seats), 10 Enterprise accounts  
- 10 % of Pro/Enterprise queries use LLM summarization  

**Revenue (monthly)**  
- Pro (2 500 × $5)   →  $12 500  
- Team (500 × $50)   →  $25 000  
- Enterprise (10 × $2 500)   →  $25 000  
**Total Revenue:** ≈ **$62 500 / month**

**Costs (monthly)**  
- Adapter compute + storage → $ 500  
- LLM + cache → $ 1 200  
- Egress + jobs → $ 300  
- Misc infra overhead → $ 2 000  
**Total Costs:** ≈ **$ 4 000 / month**

**Gross Margin:** ≈ **93 %**

---

**Scalability Notes**
- Metadata-only receipts → linear scaling ( +1 M receipts ≈ +$50 infra / month ).  
- Shared adapters and central cache reduce marginal cost per query to ~$0.0001.  
- At scale, 90 %+ gross margins sustainable with Pro and Enterprise mix.

**Economic Philosophy**
- Monetize **verification and reasoning**, not storage.  
- Keep infra light and shared — hashes scale faster than bytes.  
- Each new receipt improves all future answers at near-zero marginal cost.

## 9) Ethics & Governance

### 9.1 Transparency & Provenance Principles
The Thielverse / Frontier Index operates as a **verification utility**, not a content platform.  
Every artifact is traceable to a verifiable, timestamped source. The goal is radical transparency—any downstream reasoning must be auditable to its receipts.

**Core principles**
1. **Receipts over claims.** All data must link to primary sources (OpenAlex, USPTO, SEC, DOE/ARPA-E).  
2. **Immutable provenance.** Hashes (`hash_v1`) serve as permanent anchors; any revision is a new receipt, not an overwrite.  
3. **Open schemas.** All data contracts (`Receipt.v1.json`, `Entity.v1.json`) are public and versioned.  
4. **Auditability.** Every write emits `{request_id, adapter, fetched, inserted, deduped}` for post-hoc review.  
5. **User transparency.** Public interfaces expose source, date, and hash for every row; no hidden confidence scores or proprietary weighting.  
6. **No proprietary lock-in.** Adapters and schemas are open for inspection and reuse under permissive license (MIT or CC-BY).

---

### 9.2 Adapter Governance & Data Licensing
Adapters form the ingestion backbone of the system and are subject to continuous compliance monitoring.

**Governance model**
- **Registration:** each adapter is defined in `adapters.yml` with fields: `{source, endpoint, rate_limit, license, maintainer}`.  
- **License enforcement:** ingestion restricted to datasets under open or public-use licenses (CC-BY, CC0, U.S. Government Works, etc.).  
- **Attribution:** all UI and API outputs must include a visible source badge (`[OpenAlex]`, `[USPTO]`, etc.).  
- **Upstream corrections:** adapter maintainers required to honor `robots.txt`, usage terms, and API rate-limit policies.  
- **Change control:** adapter updates require version bump, review, and test ingestion; commits tracked in Git.  
- **Third-party inclusion:** external partners contributing adapters must sign data-use agreements ensuring legality and integrity of their feed.

**License matrix (simplified)**
| Source | License | Notes |
|---------|----------|-------|
| OpenAlex | CC-BY | Full metadata use permitted with attribution. |
| USPTO | Public domain | U.S. Government dataset. |
| SEC EDGAR | Public domain | Commercial reuse allowed. |
| DOE / ARPA-E | Public domain | Subject to FOIA and open data policies. |
| NIH RePORTER | CC-BY | Attribution required. |

---

### 9.3 Moderation & User Conduct

The platform’s moderation logic protects individuals and institutions while preserving the integrity of public records.

**Receipt moderation**
- No user-generated textual content is stored; only metadata and links to public filings.  
- Manual or automated filtering removes:
  - Personal data not present in the source.  
  - Defamatory or speculative additions (detected in summaries).  
  - Broken or malicious links (checked nightly).  
- Withdrawn or corrected upstream items remain visible but flagged with a *nullification receipt* (see §4.4).

**Lens output governance**
- All lens responses must cite receipts with `[R#]`; unverifiable statements are rejected.  
- Opinions or value judgments are out of scope.  
- Lenses simulate analytical styles (e.g., “Engineer Realist”) but do not impersonate individuals or institutions.

**User reporting**
- Every row includes “Report Issue” → sends `{hash, reason, user_id, timestamp}` to moderation queue.  
- Report categories: broken link, inaccurate metadata, incorrect frontier tag, other.  
- Moderators may annotate receipts or suppress from public feed pending verification.  

**Data retention & deletion**
- No PII collected; logs stored for 90 days.  
- Requests for removal must cite a legal or factual error; system issues nullification receipts, not deletions.

---

**Ethical commitment**
The system’s trustworthiness is grounded in openness, auditability, and restraint.  
Every datum must be traceable, reversible, and explainable.  
Ethical governance is not a post-hoc policy—it’s a design constraint.

## 10) Scaling & Throughput

### 10.1 System Benchmarks & Capacity Planning
The Thielverse / Frontier Index architecture is designed to scale linearly with available compute.  
Receipts are lightweight—metadata only—enabling extreme throughput and low storage overhead.

**Benchmark targets (demo → production)**
| Metric | Demo Target | Scaled Projection |
|---------|--------------|------------------|
| Ingestion throughput | 2 000 receipts/sec/core | 10 000 receipts/sec (5 cores) |
| Write latency (p95) | < 2 s | < 1 s steady-state |
| Read latency (p99) | < 1.2 s | < 500 ms with CDN cache |
| Cost per 3 M receipts | < $1 infra | same or lower at scale |
| API uptime | 99.5 % | 99.9 % (enterprise) |

**Storage footprint**
- Average metadata payload: ~1 KB/receipt (excluding logs).  
- 1 B receipts ≈ 1 TB raw + 1 TB indexes = **~2 TB total**.  
- Postgres handles active hot set (last 90 days ≈ 90 M receipts ≈ 300 GB).  
- Cold receipts moved to cheaper storage (S3 / Glacier) and accessed via nightly sync.

**Concurrency assumptions**
- Adapters run async; each core processes independent fetch queues.  
- Hash + insert path CPU-bound; scales horizontally.  
- DB writes batched per 250 receipts to minimize commit overhead.  

---

### 10.2 Adapter → Queue → DB Architecture
Adapters feed into a distributed ingestion bus that supports backpressure and replay.

**Write path**
```
Adapter (fetch) → Normalizer → Hash → Queue (JetStream/Kafka) → Writer (batch insert) → Postgres
```
- **JetStream (demo)**: provides persistence, deduplication, and visibility.  
- **Kafka (scale-up)**: introduces replication and replay for enterprise throughput.  
- Backpressure signals prevent adapter overfetching.  
- Each receipt carries `{source, hash, published_at, payload_ref}` for idempotent insert.

**Read path**
```
Postgres (base) → Materialized Views (frontier/day) → Edge Cache (CDN) → API
```
- Materialized views updated every minute via promoter jobs.  
- Popular queries cached as static JSON served through CDN for sub-100 ms reads.  
- API auto-fallbacks to DB if CDN cache cold.

---

### 10.3 Federated & Offline Indexing
To support government and institutional partners, the index supports **federated nodes** and **offline replicas**.

**Federated indexes**
- Each partner can host a private Postgres instance with selective adapters and internal datasets.  
- Nightly merges occur via signed receipt bundles:
  ```
  export frontier='Energy'
  thielverse-cli export --frontier=$frontier --since=2025-11-01 > energy_bundle.jsonl
  thielverse-cli sign energy_bundle.jsonl --pubkey=<partner_key>
  ```
- Bundles imported by peers with signature verification and hash reconciliation.  
- Conflicts resolved by earliest published timestamp and stable hash sort.

**Offline nodes**
- Field deployments (low connectivity environments) run minimal adapter + hash pipelines locally.  
- Upon reconnection: `sync --since=<last_sync>` performs hash-based diff merge.  
- Designed for research field teams, gov agencies, or constrained environments.

---

### 10.4 Human-in-the-Loop Verification
Automation handles ingestion, but human review anchors trust.

**Expert verification queue**
- Experts (subject-matter or data engineers) review flagged receipts:
  - Low confidence linkages (`entity_receipt.confidence < 0.6`)  
  - User reports (broken links, misclassified frontiers)  
  - Upstream nullifications  
- Reviews create *secondary receipts* (`receipt_type='verification'`) that reference original hashes and verdicts.

**Verification receipts**
```json
{
  "verified_by": "uuid-of-reviewer",
  "target_hash": "a5b3...e9",
  "verdict": "accurate" | "mislinked" | "withdrawn",
  "notes": "optional string",
  "created_at": "2025-11-06T22:34:00Z"
}
```

**Governance**
- Reviewers sign receipts using institutional or delegated keys.  
- Hashes chained into daily audit bundles (`audit_chain(frontier, day)` as defined in §4.5).  
- Enterprise nodes may maintain private verification pools or integrate with their QA systems.

---

**Scalability summary**
- Horizontal scaling via queues, stateless adapters, and partitioned DB schema.  
- Storage cost: <$2/TB/month at 1 B receipts.  
- Network egress: 90 % cache hits → <10 % dynamic reads.  
- Deterministic ingestion → no global coordination required.  
- Human verification remains the limiting step — by design — preserving data integrity as the system compounds.

The architecture scales mechanically; trust scales socially.

## 11) Risks & Threat Model

The system’s durability depends on technical reliability, legal compliance, and social legitimacy.  
This section outlines the primary risk domains and corresponding mitigations.

| Category | Risk | Description | Countermeasures |
|-----------|------|-------------|-----------------|
| **Technical** | **Rate-limits & API drift** | Upstream providers (USPTO, OpenAlex, SEC) can throttle or modify endpoints. | Distributed adapter scheduling, exponential backoff, nightly batch jobs, and periodic schema validation tests. |
|  | **Duplication / hash collisions** | Overlapping data or malformed normalization could yield duplicates or conflicting hashes. | Strict normalization (URL canonicalization + UTC dates), `unique(hash)` enforcement, and hash versioning. |
|  | **Schema creep** | Adapters evolve, adding undocumented fields. | Versioned schemas (`Receipt.v1`, `Receipt.v2`), backward-compatible migrations, automated schema diff alerts. |
|  | **Data loss / corruption** | Faulty cron jobs or upstream downtime may cause partial ingestion. | Append-only design, redundant queues, hourly integrity hashes (`audit_chain`), and recoverable replay from adapter logs. |
| **Security** | **Service key exposure** | Leaked `SUPABASE_SERVICE_KEY` could allow unauthorized writes. | Scoped keys, minimal privileges, environment isolation, rotation every 30 days. |
|  | **Injection / malformed payloads** | External sources might emit dangerous payloads. | Input sanitization, size caps, JSON schema validation, sandboxed adapter execution. |
|  | **LLM misuse / prompt injection** | Malicious input could alter lens behavior. | Static prompt templates, zero temperature, whitelist-only citation rendering. |
| **Legal / Compliance** | **Copyright** | Some datasets carry license or use restrictions. | Ingest metadata only (no full-text), retain source URLs, maintain per-source license registry. |
|  | **Defamation / privacy** | Misattribution or incorrect linking could harm reputations. | Public data only, visible provenance, rapid nullification receipts (§4.4), moderation queue for disputes. |
|  | **Data retention** | Overlong log retention could breach privacy expectations. | Retain logs 90 days, anonymize IP data after 7 days. |
| **Market / Adoption** | **Perceived thinness** | Metadata-only model may seem less “rich” to new users. | Focus on speed, provenance, and analytical features (lenses, briefs) to demonstrate value. |
|  | **Competition / API parity** | Open data competitors may offer similar endpoints. | Differentiate via verification, deterministic provenance, and composable receipt index. |
|  | **Revenue concentration** | Dependence on a few enterprise contracts early. | Diversify frontiers and adapters, grow self-serve Pro base. |
| **Privacy / Ethics** | **Unintended PII capture** | Some filings include contact info. | Regex filters and source blacklists for known PII fields. |
|  | **Bias amplification** | Lenses might overweight sources from certain regions or fields. | Frontier diversity, cross-source weighting, red-team lens audits. |
| **Operational** | **Incident response gaps** | Adapter or cron failure may persist unnoticed. | Health checks, `/api/health` endpoint, and Grafana alerts on latency/error anomalies. |
|  | **Human error in verification** | Expert review mistakes can propagate. | Dual-review system, signed verification receipts, audit of reviewer accuracy. |

---

**Residual risk assessment**
- **Most likely:** rate-limit fluctuations, minor schema drifts — operationally manageable.  
- **Most severe:** data integrity compromise from upstream source mutation — mitigated via audit chains and append-only semantics.  
- **Hardest to detect:** subtle bias drift in lens outputs — mitigated by continuous evaluation and human oversight.

The system treats risk management as an engineering layer: verifiability is not just a feature but the fail-safe mechanism itself.

## 12) Appendices

### 12.1 Schema ERD (ASCII)
```
+-----------+        +----------------+       +------------------+
| receipts  |        | entity_receipt |       | entities         |
+-----------+        +----------------+       +------------------+
| id (pk)   |<----+  | entity_id (fk) |   +-->| id (pk)          |
| source    |     |  | receipt_id(fk) |   |   | slug (unique)    |
| title     |     |  | role           |   |   | name             |
| url       |     |  +----------------+   |   | kind             |
| published |     |                       |   | profile (jsonb)  |
| frontier  |     |                       |   +------------------+
| hash(!)   |     |                       
| summary   |     |                       
| visible   |     |                       
| created   |     |                       
+-----------+     |                       
                  +-----------------------+
```

---

### 12.2 Adapter Specification (v0)
```
Input:  API or RSS endpoint (JSON)
Output: Array<Receipt> normalized objects
Behavior:
  - Fetch with exponential backoff
  - Normalize and hash (sha256)
  - Upsert idempotently by hash
  - Log counts {fetched, inserted, deduped, errors[]}
  - Respect robots.txt and rate-limit headers
Error Handling:
  - Retry max 3 times with jitter
  - Skip malformed items with warning log
  - Record adapter health to /api/health
```

Example adapter config:
```yaml
source: "OpenAlex"
endpoint: "https://api.openalex.org/works"
fetch_interval: "15m"
rate_limit: 1000 / 10m
license: "CC-BY"
maintainer: "core-team"
```

---

### 12.3 Prompt Library (Top 5 Lenses)
```
1. Contrarian Builder
   → "Use only receipts. Value patents/grants over press. 4 sentences. Cite [R#]."

2. Engineer Realist
   → "Describe technical progress and bottlenecks. 5 sentences. Cite [R#]."

3. Policy Skeptic
   → "Contrast regulatory filings vs claims. 3–4 sentences. Cite [R#]."

4. Market Mapper
   → "Map funding and partnerships from SEC/press releases. 4 bullets with [R#]."

5. Risk Officer
   → "List top 3 risks with receipts. 3 bullets with [R#]."
```

All prompts enforce citation syntax and rejection of unverified claims (`"Not enough receipts."` fallback).

---

### 12.4 Rate-Limit & API Notes
```
OpenAlex
  - 100 requests/min public
  - Retry-After header respected
  - generous pagination (max 200 items)

USPTO
  - 25 requests/sec (keyed)
  - Heavy payloads → batch nightly
  - Cache partials locally

SEC (EDGAR)
  - ~10 requests/sec, IP-based throttle
  - Prefer mirror endpoints for volume

DOE / ARPA-E
  - No rate limits but frequent downtime
  - Validate JSON shape; handle 503
```

Operational strategy:
- Distribute adapters across regions.
- Stagger fetch intervals by 1–3 min offsets.
- Backoff factor = 1.8, jitter = ±15 %.

---

### 12.5 Ops Runbook (Demo)

**Availability Targets**
- UI uptime ≥ 99.5 %
- API p99 latency < 1.2 s
- Receipt freshness (Pro): < 10 min lag

**Critical Paths**
1. `cron_openalex` (15m)
2. `cron_promote` (1m)
3. `adapter_health_check` (10m)

**On-call Actions**
| Incident | First Action | Escalation |
|-----------|---------------|-------------|
| Promoter stalled | Restart queue worker | Rebuild materialized views |
| Adapter 429s | Increase backoff; throttle fetch | Disable adapter for 1h |
| DB latency >2s | Rotate read replicas | Purge cold partitions |
| API 5xx >1% | Restart Next.js service | Post mortem in 24h |

**Monitoring Stack**
- Grafana + Supabase metrics  
- Slack webhook alerts  
- Daily ingestion report (email)  

---

### 12.6 Known Incidents (Demo Log)
| Date | Description | Impact | Resolution |
|------|--------------|---------|-------------|
| 2025-11-03 | OpenAlex pagination bug | Duplicate hashes (~0.2%) | Normalizer patch, re-run adapter |
| 2025-11-04 | SEC API intermittent 503 | 3 min data gap | Auto-retry recovered |
| 2025-11-05 | Adapter key expired | 45 min pause in Energy frontier | Rotated credentials, alert rule added |

---

**Appendix Summary**
These appendices document the low-level schema, ingestion standards, operational controls, and recovery record.  
They ensure the system can be audited, replicated, and extended without central dependency.

## 13) Why This Scales

Thielverse / Frontier Index scales because its **unit of truth — the receipt — is atomic, append-only, and verifiable.**  
It doesn’t depend on user growth, network effects, or content volume.  
Every new data source increases the fidelity of the entire system, not its complexity.

The architecture compounds across three axes:

1. **Data:** Each adapter contributes normalized receipts into a shared hash space.  
   New frontiers (AI, Energy, Biotech, Crypto) slot cleanly into existing schema with no structural change.  
   The cost of adding a source is near-zero after normalization, and all receipts benefit from global deduplication.  

2. **Verification:** Hashes, audit chains, and human review create a proof-of-memory layer that resists drift.  
   As data volume rises, confidence rises — not entropy.  
   Append-only design ensures that every version of every claim can be reconstructed, verified, or disputed indefinitely.  

3. **Intelligence:** Lenses convert verified memory into deterministic reasoning.  
   The more receipts available, the more constrained and precise model outputs become.  
   Lenses become *more right* over time — not by new parameters, but by deeper context.

**Economic inevitability**
- Metadata-only ingestion keeps marginal storage costs near zero.  
- Shared adapters amortize infrastructure across every partner and product.  
- Enterprises plug into an index they can verify independently — lowering switching costs and raising trust.  

**Social inevitability**
- Institutions require reproducible reasoning before trusting AI systems.  
- Governments require transparent provenance before funding innovation.  
- Builders require visible proof of progress before allocating capital.  
The same primitives — receipts, hashes, and lenses — solve all three.

At global scale, the system converges toward a universal substrate of verifiable progress:  
every scientific paper, patent, or filing as a signed receipt in a living, queryable memory.  
It’s the infrastructure layer that turns information into evidence — and evidence into trust.

**receipts-in • bias-out**
