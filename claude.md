# Claude Code for Thielverse / Frontier Index

This document outlines how Claude Code accelerates development of the **Thielverse intelligence network** — a verified, monetizable layer for frontier innovation receipts.

---

## Project Vision

**Thielverse** transforms public data (papers, patents, filings, grants) into a two-layer intelligence network:

1. **Receipt Layer** (Free): Verified metadata with cryptographic hashes - the "receipts of human progress"
2. **Analysis Layer** (Pro): Content-addressed intelligence (CID) with entity linking, technical scoring, market signals, regulatory risk, and deterministic lenses

**Core Insight**: 10M receipts → 100k analyzed. Quality over exhaustiveness. Selective intelligence generation = scalable margins.

**Tech Stack**: Next.js 16, TypeScript, Supabase (PostgreSQL + Storage), IPFS-compatible CIDs, UCAN-ready permissions

---

## Architecture Overview

### Two-Layer Data Model

```
┌─────────────────────────────────────────────────────────────┐
│                    PUBLIC TIER (Free)                       │
│  Receipts: hash, title, url, date, source, frontier        │
│  Access: 7-day delayed metadata feed                       │
│  Cost: $0   |   Margin: Infinite (metadata-only)          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   INTELLIGENCE TIER (Pro)                   │
│  CID → Analysis JSON (entity links, technical depth,       │
│         market signals, regulatory risk, sentiment)         │
│  Access: Real-time + full analysis JSONs                   │
│  Cost: $5/mo | Margin: ~93% (cached, deterministic)       │
└─────────────────────────────────────────────────────────────┘
```

### Receipt → CID Relationship

```typescript
// Receipt (always public, free tier)
{
  id: uuid,
  hash: sha256(url|date|title),      // deduplication
  cid?: string,                      // IPFS CID → analysis JSON
  source, title, url, published_at,
  frontier, visible, created_at
}

// Analysis JSON (CID-addressed, Pro tier)
{
  cid: "bafybei...",                 // IPFS-compatible CID
  receipt_hash: "abc123...",         // links back
  version: "v1",
  created_at: ISO,

  entity_links: [{slug, confidence, role, evidence}],
  technical: {innovation_score, depth, breakthrough_signals},
  market: {funding_signal, momentum, partnerships},
  regulatory: {risk_score, compliance_flags, policy_relevance},
  sentiment: {overall, technical_confidence},
  lenses: {[name]: {output, citations, computed_at}}
}
```

### Pipeline Flow

```
[Adapter Fetch]
    ↓
Normalize → Hash (deduplication)
    ↓
Upsert Receipt (CID=null, visible=false)
    ↓
[Background Cron - Selective]
    ↓
Quality Filter (top 1% by novelty/impact)
    ↓
Generate Analysis (entity, technical, market, regulatory)
    ↓
Compute CID (IPFS-compatible)
    ↓
Store JSON → Supabase Storage (analyses/{cid}.json)
    ↓
Update Receipt (cid=xxx, visible=true)
```

**Key**: Not every receipt gets analyzed. Only the best ~1-10% based on:
- Novelty score
- Entity prominence
- Source credibility
- Frontier priority
- User demand

---

## Schema Evolution

### Current Schema
```sql
receipts (id, source, title, url, published_at, frontier, hash unique,
          summary, visible, created_at)
entities (id, slug unique, name, kind, profile)
entity_receipt (entity_id, receipt_id, role)
```

### New Schema (CID-enabled)
```sql
-- Add CID column to receipts
ALTER TABLE receipts ADD COLUMN cid TEXT;
CREATE INDEX idx_receipts_cid ON receipts(cid) WHERE cid IS NOT NULL;

-- New: analyses metadata table (optional but useful)
CREATE TABLE IF NOT EXISTS analyses (
  cid TEXT PRIMARY KEY,
  receipt_hash TEXT NOT NULL REFERENCES receipts(hash),
  version TEXT NOT NULL DEFAULT 'v1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  storage_path TEXT NOT NULL,
  analysis_types TEXT[],      -- ['entity', 'technical', 'market', 'regulatory']
  quality_score FLOAT,         -- 0-1, why this was selected for analysis
  processed_by TEXT,           -- job version
  token_cost INT               -- LLM tokens used (cost tracking)
);

-- Add quality scoring columns to receipts (for filtering)
ALTER TABLE receipts ADD COLUMN novelty_score FLOAT;
ALTER TABLE receipts ADD COLUMN impact_score FLOAT;
CREATE INDEX idx_receipts_quality ON receipts(novelty_score DESC, impact_score DESC)
  WHERE novelty_score IS NOT NULL;
```

### Supabase Storage Buckets
```
analyses/          # Main intelligence JSONs
  {cid}.json       # e.g., bafybei.../abc123...json

lenses/            # Cached lens outputs (optional separate storage)
  {lens_name}/{entity_slug}/{hash}.json
```

---

## What Claude Code Can Do for This Project

### 1. CID & Analysis Pipeline

**Implement content-addressed intelligence:**

- "Add CID generation utility using IPFS multihash format"
- "Create analysis JSON generator with all 5 intelligence layers"
- "Build background job to analyze top 1% receipts by novelty score"
- "Implement quality scoring algorithm (novelty + impact + credibility)"

Claude Code can:
- Generate IPFS-compatible CIDs (using js-multihash or crypto)
- Write analysis pipeline that processes receipts → generates intelligence → computes CID
- Create background jobs with retry logic and cost tracking
- Implement filtering to select best receipts for analysis

### 2. Intelligence Generation

**Build the 5 analysis layers:**

- "Implement entity linking with confidence scoring and evidence"
- "Create technical depth analyzer (innovation score, breakthrough signals)"
- "Build market signal extractor (funding, partnerships, momentum)"
- "Add regulatory risk scoring with compliance flags"
- "Implement sentiment analysis with confidence bounds"

Claude Code can:
- Use LLMs for entity extraction and linking
- Parse patents/papers for technical depth signals
- Extract funding/partnership mentions from SEC filings
- Score regulatory risk based on keywords and patterns
- Aggregate signals into structured JSON

### 3. Supabase Storage Integration

**Set up content-addressed storage:**

- "Configure Supabase Storage bucket for analysis JSONs with RLS"
- "Build /api/analysis/:cid endpoint with Pro tier gating"
- "Create storage utility to upload/fetch JSON by CID"
- "Implement caching layer for hot CIDs"

Claude Code can:
- Set up storage buckets with proper permissions
- Write upload/download utilities
- Add RLS policies for tier-based access
- Implement CDN caching for popular analyses

### 4. Monetization & Tier Gating

**Build the business model into the code:**

- "Add tier detection to all API routes (Free vs Pro vs Enterprise)"
- "Create /api/receipts/enriched with conditional CID inclusion"
- "Build 'Unlock Analysis' UI component for free tier"
- "Implement API token system for Pro tier access"

Claude Code can:
- Add middleware for tier detection
- Create conditional responses based on user tier
- Build UI components showing free vs pro value
- Integrate with Stripe or payment system

### 5. Quality Scoring & Selection

**Implement selective analysis:**

- "Create novelty scoring algorithm using TF-IDF on titles"
- "Build impact scorer based on source credibility + entity prominence"
- "Implement analysis queue prioritization by quality score"
- "Add admin endpoint to manually trigger analysis for specific receipts"

Claude Code can:
- Write scoring algorithms with tunable weights
- Create priority queues for analysis jobs
- Build admin tools for manual overrides
- Add monitoring for analysis coverage (% of receipts analyzed)

### 6. UCAN/DID Architecture (Future-Proof)

**Prepare for decentralized permissions:**

- "Structure analysis access for UCAN capability tokens"
- "Add DID fields to user/entity schemas"
- "Implement CID-based capability delegation"
- "Create UCAN token verification middleware"

Claude Code can:
- Research and implement UCAN spec
- Add DID support for users/agents
- Structure permissions as capabilities (not ACLs)
- Build migration path from API keys to UCANs

### 7. Lens System Enhancement

**Integrate lenses with CID architecture:**

- "Cache lens outputs in analysis JSON (CID.lenses)"
- "Build lens executor that runs all lenses on high-quality receipts"
- "Create deterministic lens runner (zero temp, citation-bound)"
- "Add lens output to free tier (limited) vs pro tier (full)"

Claude Code can:
- Modify lens API to read/write from CID JSONs
- Implement batch lens execution for new analyses
- Add lens outputs to analysis pipeline
- Create tiered lens access (summaries free, full analysis pro)

### 8. Demo Page & UI

**Build the YC demo showcase:**

- "Create /demo page showing free vs pro side-by-side"
- "Build receipt detail modal with 'Unlock Analysis' CTA"
- "Add intelligence preview (first 2 bullets free, rest locked)"
- "Create beautiful, minimalist UI with Tailwind v4"

Claude Code can:
- Design and implement demo page
- Create interactive CTAs showing value prop
- Build comparison views (before/after intelligence)
- Polish UI for sub-200ms renders and dark theme

### 9. Adapter Evolution

**Upgrade adapters for quality scoring:**

- "Add novelty detection to adapters (check against existing receipts)"
- "Implement source credibility scoring in adapter configs"
- "Create adapter priority tiers (high priority = faster analysis)"
- "Build adapter dashboard showing coverage and quality metrics"

Claude Code can:
- Enhance adapters with quality signals
- Add metadata for scoring (source tier, peer-reviewed flag)
- Create monitoring dashboards
- Implement backfill jobs for high-quality sources

### 10. Cost Tracking & Economics

**Instrument the system for profitability:**

- "Add token counting to all LLM calls"
- "Track analysis costs per receipt (tokens, compute time)"
- "Build cost dashboard (spend vs revenue by tier)"
- "Implement analysis budget caps (max $X/day on generation)"

Claude Code can:
- Instrument LLM calls with token counting
- Log costs to database
- Create dashboards for unit economics
- Add circuit breakers for runaway costs

### 11. Entity Intelligence Aggregation

**Roll up receipt-level intelligence to entities:**

- "Create entity_intelligence table (aggregated CID data)"
- "Build /api/entities/:slug/intelligence endpoint"
- "Implement entity timeline with intelligence annotations"
- "Add entity scoring (technical, market, regulatory dimensions)"

Claude Code can:
- Aggregate analyses by entity
- Create time-series intelligence views
- Build entity scoring algorithms
- Generate entity "report cards"

### 12. Search & Discovery

**Make intelligence queryable:**

- "Build /api/search?q=fusion+energy with intelligence filtering"
- "Create semantic search over analysis JSONs"
- "Implement frontier-specific search (AI papers, Energy patents)"
- "Add 'similar receipts' feature using analysis embeddings"

Claude Code can:
- Implement full-text search with Postgres
- Add vector search with embeddings
- Create intelligent ranking (by quality + relevance)
- Build discovery features

### 13. Backfill & Migration

**Prepare existing data for CID system:**

- "Delete existing 32 receipts (pre-CID schema)"
- "Re-ingest with new hash + CID workflow"
- "Backfill quality scores for all receipts"
- "Generate analyses for top 50-100 receipts for demo"

Claude Code can:
- Write migration scripts
- Backfill quality scores
- Generate sample analyses
- Validate schema changes

### 14. Testing & Validation

**Ensure determinism and quality:**

- "Write tests for CID generation (same JSON → same CID)"
- "Test analysis pipeline end-to-end"
- "Validate tier gating (free can't access CIDs)"
- "Smoke test all 5 intelligence layers"

Claude Code can:
- Write comprehensive test suites
- Create test fixtures for analyses
- Validate JSON schemas
- Test edge cases (missing data, errors)

### 15. Documentation & Developer Experience

**Make the system understandable:**

- "Update architecture docs with CID model"
- "Create API docs for /api/analysis/:cid"
- "Write analysis JSON schema spec"
- "Document quality scoring algorithm"

Claude Code can:
- Update all architecture docs
- Generate OpenAPI specs
- Write clear explanations
- Create examples and guides

---

## YC Demo Workflow (3-4 Hour Sprint)

### Must-Have (Core Demo)

**Hour 1: Schema & CID Foundation**
1. Add CID column to receipts
2. Create analyses table
3. Implement CID generation (IPFS-compatible)
4. Set up Supabase Storage bucket

**Hour 2: Analysis Generation**
1. Define AnalysisV1 TypeScript types
2. Create analysis JSON generator (hand-crafted for top 10-20 receipts)
3. Upload to Supabase Storage
4. Update receipts with CIDs

**Hour 3: API & Tier Gating**
1. Build /api/analysis/:cid endpoint (Pro only)
2. Update /api/receipts/enriched to include CID for Pro
3. Add tier detection middleware
4. Test free vs pro responses

**Hour 4: UI & Polish**
1. Create receipt detail view with "Unlock Analysis" button
2. Build analysis preview (first 2 bullets free)
3. Add /demo page showing free vs pro side-by-side
4. Polish UI: minimalist, fast, beautiful

### Demo Flow

```
1. Home → Frontier Feed (receipts scrolling)
2. Click receipt → Modal opens
   - Free tier: See metadata + hash
   - "Unlock Full Intelligence" button (shows what's behind paywall)
3. Click unlock → Shows sample analysis JSON
   - Entity links with confidence
   - Technical innovation score
   - Market signals
   - Regulatory flags
   - Sentiment + lenses
4. Navigate to /demo → Side-by-side comparison
   - Left: Free tier experience
   - Right: Pro tier experience
   - Clear value prop: "$5/mo for full intelligence"
5. Entity page → Aggregated intelligence
   - Timeline with analysis annotations
   - Quality receipts highlighted
```

---

## Business Model (Built Into Code)

### Tier Structure

| Feature | Free | Pro ($5/mo) | Enterprise ($25k+/yr) |
|---------|------|-------------|----------------------|
| Receipts (hash, metadata) | ✅ 7-day delay | ✅ Real-time | ✅ Real-time |
| CID access | ❌ | ✅ All | ✅ All + private |
| Analysis JSON | ❌ | ✅ Full | ✅ Full + custom |
| Lens outputs | ✅ Summaries | ✅ Full | ✅ Full + custom lenses |
| API access | ❌ | ✅ 1k req/day | ✅ Unlimited |
| Intelligence coverage | Top 100 | All analyzed | All + private datasets |

### Unit Economics

```
10M receipts → 100k analyzed (1%)

Analysis cost: $0.01 per receipt (LLM + compute)
Total analysis cost: 100k × $0.01 = $1,000

Serve cost: $0.001 per CID fetch (cached)
10k Pro users × 10 fetches/day × 30 days = 3M fetches = $3,000/mo

Revenue: 10k Pro users × $5/mo = $50,000/mo
Margin: ($50k - $3k - $33 amortized) / $50k = 93%
```

**Key insight**: Generate once, serve many times. Selective analysis keeps costs low, quality high.

---

## Project-Specific Patterns

### 1. CID Generation (IPFS-Compatible)
```typescript
import { create } from 'multiformats/hashes/sha2'
import * as Block from 'multiformats/block'
import { sha256 } from 'multiformats/hashes/sha2'
import * as dagJSON from '@ipld/dag-json'

async function generateCID(analysisJSON: AnalysisV1): Promise<string> {
  const block = await Block.encode({
    value: analysisJSON,
    codec: dagJSON,
    hasher: sha256
  })
  return block.cid.toString() // e.g., "bafybei..."
}
```

### 2. Quality Scoring
```typescript
function computeQualityScore(receipt: Receipt): number {
  const novelty = computeNoveltyScore(receipt.title, receipt.frontier)
  const impact = computeImpactScore(receipt.source, receipt.entities)
  const credibility = SOURCE_CREDIBILITY[receipt.source] || 0.5

  return (novelty * 0.4) + (impact * 0.4) + (credibility * 0.2)
}

// Novelty: TF-IDF on title against existing receipts
// Impact: Entity prominence + citation count (future)
// Credibility: Source tier (peer-reviewed > press release)
```

### 3. Tier Gating Middleware
```typescript
async function getTier(req: Request): Promise<'free' | 'pro' | 'enterprise'> {
  const token = req.headers.get('Authorization')
  if (!token) return 'free'

  const user = await validateToken(token)
  return user.tier
}

export async function GET(req: Request) {
  const tier = await getTier(req)
  const receipts = await fetchReceipts()

  if (tier === 'free') {
    // Strip CIDs, apply 7-day delay
    return receipts.filter(r => isOlderThan(r, 7)).map(r => ({ ...r, cid: undefined }))
  }

  return receipts // Include CIDs
}
```

### 4. Analysis JSON Storage
```typescript
async function storeAnalysis(cid: string, analysis: AnalysisV1): Promise<void> {
  const supaStorage = createClient(...)

  await supaStorage.storage
    .from('analyses')
    .upload(`${cid}.json`, JSON.stringify(analysis), {
      contentType: 'application/json',
      cacheControl: '3600',
      upsert: false
    })

  // Also store metadata in analyses table
  await supaDB.from('analyses').insert({
    cid,
    receipt_hash: analysis.receipt_hash,
    version: analysis.version,
    storage_path: `${cid}.json`,
    analysis_types: ['entity', 'technical', 'market', 'regulatory'],
    quality_score: computeQuality(...),
    token_cost: analysis.token_cost
  })
}
```

---

## Quick Start Commands

### Architecture Exploration
- "Show me how receipts link to analyses via CID"
- "Explain the quality scoring algorithm"
- "Where does tier gating happen?"
- "How do we generate IPFS-compatible CIDs?"

### Development
- "Add CID column and migrate existing receipts"
- "Create analysis JSON generator for top 50 receipts"
- "Build /api/analysis/:cid endpoint with Pro tier check"
- "Implement quality scoring and add to receipts"

### Demo Building
- "Create 'Unlock Analysis' UI component"
- "Build /demo page showing free vs pro comparison"
- "Generate sample analyses for helion-energy entity"
- "Polish UI for minimalist dark theme"

### Testing
- "Test CID generation is deterministic"
- "Validate tier gating blocks free users from CIDs"
- "Smoke test analysis JSON schema"
- "Load test /api/analysis/:cid endpoint"

---

## Why This Architecture Wins

### 1. **Clear Monetization**
Free tier proves value (verified receipts), Pro tier captures revenue (intelligence), Enterprise scales (custom analysis)

### 2. **Scalable Economics**
Selective analysis (1-10% of receipts) keeps costs low. Cached, deterministic outputs scale to millions of users.

### 3. **Verifiable + Intelligent**
Receipts are still append-only and hashable (trust layer). Intelligence is content-addressed and versioned (iteration layer).

### 4. **Future-Proof**
IPFS-compatible CIDs, UCAN-ready permissions, DID support planned. Can decentralize later without breaking existing system.

### 5. **Compounding Moat**
Every analyzed receipt improves entity graphs, quality scoring, and lens outputs. The network gets smarter over time.

---

## Bottom Line

Claude Code can help you build the **verified intelligence layer for frontier innovation** — from cryptographic receipts to content-addressed analysis to tiered monetization.

The system sells **knowledge about proof-of-work**, not the work itself. The intelligence compounds. The margins are 90%+.

**Ready to build the future? Let's go.**
