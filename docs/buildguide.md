# Thielverse / Frontier Index — BUILD GUIDE (v3)
_mode: LEGO manual • scope: 72h demo • target: thielverse.xyz_

---

## 0) Success Criteria (what “done” is)
- Home feed loads < 2s, counter ticks within 90s, 200+ visible rows.
- `/entity/helion-energy` renders receipts + canned Ask.
- `/api/receipts/latest`, `/api/entities/:slug`, `/api/brief` return JSON.
- Vercel Cron flips rows visible; OpenAlex trickles live.
- No secrets in client bundle; public has 7-day delay.

---

## 1) Module A — Workspace & Repo

### A1. Create repo
```bash
mkdir thielverse && cd thielverse
pnpm create next-app@latest apps/web --ts --tailwind --src-dir --eslint
mkdir -p adapters db scripts docs
touch .env.example .env.local vercel.json README.md
```
### A2. Canonical tree (target)
thielverse/
├─ apps/web/
│  ├─ src/app/
│  │  ├─ page.tsx
│  │  ├─ entity/[slug]/page.tsx
│  │  ├─ brief/page.tsx
│  │  ├─ enterprise/page.tsx
│  │  ├─ about/page.tsx
│  │  └─ api/{receipts/latest,entities/[slug],ask,brief,cron/{promote,openalex}}/route.ts
│  ├─ src/components/
│  └─ src/lib/{supa.ts,time.ts,types.ts}
├─ adapters/{openalex.ts, seed.csv, README.md}
├─ db/{schema.sql, seeds.sql, bulk_seed.sql}
├─ scripts/{csv_to_sql.ts, make_brief.ts}
├─ docs/{agentpack.md, BUILD_GUIDE.md, YCdemoPRD.md, architecturalmemo.md}
└─ vercel.json

### A3. Smoke Test
cd apps/web && pnpm dev
#Expect Next.js starter page at http://localhost:3000

## 2) Module B — Environment & Secrets
### B1. .env.example (copy to .env.local)
NEXT_PUBLIC_SITE_URL=https://thielverse.xyz
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=   # server-only
OPENAI_API_KEY=         # optional; canned answers if empty
DEMO_DELAY_DAYS=7
BRAND_NAME=Frontier Index
Rule: SERVICE_KEY never in client code. Only server routes use it.
### B2. Vercel project link (later in Module I we deploy and pull envs)
### B3. Smoke Test
test -f .env.local && echo "env ok" || echo "missing env"

## 3) Module C — Database (Supabase / Postgres)
### C1. Schema: db/schema.sql
create extension if not exists pgcrypto;

create table if not exists receipts (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  title text not null,
  url text not null,
  published_at timestamptz not null,
  frontier text,
  hash text unique not null,
  summary text,
  visible boolean default false,
  created_at timestamptz default now()
);

create table if not exists entities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  kind text not null,   -- 'company'|'person'|'lab'
  profile text
);

create table if not exists entity_receipt (
  entity_id uuid references entities(id) on delete cascade,
  receipt_id uuid references receipts(id) on delete cascade,
  role text,
  primary key (entity_id, receipt_id)
);

-- RLS read-only
alter table receipts enable row level security;
create policy receipts_read on receipts for select using (true);

alter table entities enable row level security;
create policy entities_read on entities for select using (true);

alter table entity_receipt enable row level security;
create policy entity_receipt_read on entity_receipt for select using (true);

-- indexes
create index if not exists idx_receipts_pub on receipts(published_at desc);
create index if not exists idx_receipts_frontier on receipts(frontier);
create index if not exists idx_entity_slug on entities(slug);

### C2. Minimal seed: db/seeds.sql
-- Entity
insert into entities (slug,name,kind,profile)
values ('helion-energy','Helion Energy','company','Fusion company; demo entity.')
on conflict (slug) do nothing;

-- Two example receipts (replace with verified links later)
insert into receipts (source,title,url,published_at,frontier,hash,summary,visible) values
('SEC','Helion Energy — Form D','https://www.sec.gov/Archives/edgar/data/...','2025-10-17T12:00:00Z','Energy','hash_demo_1','Capital raise filing.',false),
('OpenAlex','Materials for MTF','https://openalex.org/works/Wxxxx','2025-09-02T00:00:00Z','Energy','hash_demo_2','Paper on fusion materials.',false)
on conflict (hash) do nothing;

-- Link entity ↔ receipts
insert into entity_receipt(entity_id,receipt_id)
select e.id,r.id from entities e,receipts r
where e.slug='helion-energy' and r.hash in ('hash_demo_1','hash_demo_2')
on conflict do nothing;

### C3. Run schema & seed in Supabase SQL editor.
### C4. Smoke Test

In Supabase Table Editor, confirm rows exist.

Indices present under Database → Tables → Indexes.

## 4) Module D — Shared Libs
### D1. apps/web/src/lib/supa.ts
import { createClient } from '@supabase/supabase-js';

export const supaAnon = () =>
  createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

export const supaService = () =>
  createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

### D2. apps/web/src/lib/time.ts
export const ago = (ts: string|Date) => {
  const s = Math.floor((Date.now() - new Date(ts).getTime())/1000);
  const m = Math.floor(s/60), r = s%60;
  return m ? `${m}m ${r}s` : `${r}s`;
};

### D3. apps/web/src/lib/types.ts
export type Receipt = {
  id: string; source: string; title: string; url: string;
  published_at: string; frontier?: string; hash: string;
  summary?: string; visible: boolean; created_at: string;
};

### D4. Smoke Test
tsc -p apps/web/tsconfig.json --noEmit
#Expect no type errors
## 5) Module E — API Routes (server)
All in apps/web/src/app/api/.../route.ts

### E1. /api/receipts/latest
import { NextResponse } from 'next/server';
import { supaAnon } from '@/src/lib/supa';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const frontier = searchParams.get('frontier') || undefined;
  const mode = searchParams.get('mode') || 'public';
  const delayDays = mode === 'public' ? Number(process.env.DEMO_DELAY_DAYS || '7') : 0;

  const supa = supaAnon();
  let q = supa.from('receipts')
    .select('id,source,title,url,published_at,frontier,hash,summary,visible,created_at')
    .eq('visible', true)
    .order('published_at', { ascending: false })
    .limit(50);

  if (delayDays > 0) {
    const cutoff = new Date(Date.now() - delayDays*86400000).toISOString();
    q = q.lte('published_at', cutoff);
  }
  if (frontier) q = q.eq('frontier', frontier);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
### E2. /api/entities/[slug]
import { NextResponse } from 'next/server';
import { supaAnon } from '@/src/lib/supa';

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const supa = supaAnon();
  const { data: entities, error } = await supa.from('entities').select('*').eq('slug', params.slug).limit(1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!entities?.length) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const e = entities[0];
  const { data: links } = await supa.from('entity_receipt').select('receipt_id').eq('entity_id', e.id).limit(50);
  const ids = links?.map(l => l.receipt_id) || [];
  const { data: receipts } = await supa.from('receipts').select('*').in('id', ids).order('published_at', { ascending: false });
  return NextResponse.json({ entity: e, receipts: receipts || [] });
}
### E3. /api/ask (canned)
import { NextResponse } from 'next/server';
import { supaAnon } from '@/src/lib/supa';

export async function POST(req: Request) {
  const { entity } = await req.json();
  const supa = supaAnon();
  const { data: e } = await supa.from('entities').select('id,slug,name').eq('slug', entity).limit(1);
  if (!e?.length) return NextResponse.json({ answer: 'Not enough receipts.' });

  const { data: links } = await supa.from('entity_receipt').select('receipt_id').eq('entity_id', e[0].id).limit(5);
  const ids = links?.map(l => l.receipt_id) || [];
  const { data: rs } = await supa.from('receipts').select('title,source,hash').in('id', ids);
  const bullets = (rs||[]).map((r,i)=>`${i+1}. ${r.title} — ${r.source} [R${i+1}:${r.hash.slice(0,6)}]`).join('\n');
  return NextResponse.json({ answer: `Based on recent receipts:\n${bullets}` });
}

### E4. /api/brief
import { NextResponse } from 'next/server';
import { supaAnon } from '@/src/lib/supa';

const FRONTS = ['AI','Energy','Biotech','Thielverse'];

export async function GET() {
  const supa = supaAnon();
  const out: any[] = [];
  for (const f of FRONTS) {
    const { data } = await supa.from('receipts')
      .select('title,hash,source,published_at').eq('frontier', f).eq('visible', true)
      .order('published_at', { ascending: false }).limit(3);
    out.push({ frontier: f, items: data || [] });
  }
  return NextResponse.json({ date: new Date().toISOString(), frontiers: out });
}

### E5. Cron — /api/cron/promote
import { NextResponse } from 'next/server';
import { supaService } from '@/src/lib/supa';

export async function GET() {
  const supa = supaService();
  const { data } = await supa.from('receipts').select('id').eq('visible', false).order('published_at', { ascending: false }).limit(3);
  if (data?.length) await supa.from('receipts').update({ visible: true }).in('id', data.map(d => d.id));
  return NextResponse.json({ promoted: data?.length || 0 });
}

### E6. Cron — /api/cron/openalex (tiny trickle)
import { NextResponse } from 'next/server';
import { supaService } from '@/src/lib/supa';
import crypto from 'node:crypto';

export async function GET() {
  const supa = supaService();
  const res = await fetch('https://api.openalex.org/works?search=fusion&sort=publication_date:desc&per_page=3', { cache: 'no-store' });
  if (!res.ok) return NextResponse.json({ added: 0 });
  const json = await res.json();
  let added = 0;
  for (const w of (json?.results || [])) {
    const title = w.title;
    const url = w.id;
    const published_at = w.published_date || `${w.publication_year}-01-01T00:00:00Z`;
    const hash = crypto.createHash('sha256').update(`${url}|${published_at}|${title}`).digest('hex');
    const { error } = await supa.from('receipts').upsert({
      source: 'OpenAlex', title, url, published_at, frontier: 'Energy', hash, summary: '', visible: true
    }, { onConflict: 'hash' });
    if (!error) added++;
  }
  return NextResponse.json({ added });
}

### E7. Smoke Tests
curl -s http://localhost:3000/api/receipts/latest | jq . | head
curl -s http://localhost:3000/api/entities/helion-energy | jq '.entity.slug'
curl -s -X POST http://localhost:3000/api/ask -H "Content-Type: application/json" -d '{"entity":"helion-energy","q":"status"}' | jq .

## 6) Module F — UI Surfaces (minimal, fast)

Keep it text-first. Tailwind only.

### F1. Home: apps/web/src/app/page.tsx
import Link from 'next/link';

async function getData(frontier?: string) {
  const u = new URL(`${process.env.NEXT_PUBLIC_SITE_URL}/api/receipts/latest`);
  if (frontier) u.searchParams.set('frontier', frontier);
  const res = await fetch(u.toString(), { next: { revalidate: 0 }, cache: 'no-store' });
  return res.json();
}

export default async function Page({ searchParams }: { searchParams?: { frontier?: string } }) {
  const data = await getData(searchParams?.frontier);
  return (
    <main className="mx-auto max-w-[900px] p-6">
      <h1 className="text-xl font-semibold">Frontier Feed</h1>
      <p className="text-sm mt-1">{data.length} receipts indexed • public is 7-day delayed</p>
      <div className="mt-4 space-x-2">
        {['AI','Energy','Biotech','Thielverse'].map(f=>(
          <Link key={f} href={`/?frontier=${f}`} className="underline text-blue-700">{f}</Link>
        ))}
      </div>
      <table className="w-full mt-4 text-sm">
        <thead><tr className="text-left border-b"><th>Date</th><th>Source</th><th>Title</th><th>Hash</th></tr></thead>
        <tbody>
          {data.map((r:any)=>(
            <tr key={r.id} className="border-b">
              <td>{new Date(r.published_at).toISOString().slice(0,10)}</td>
              <td>{r.source}</td>
              <td><a className="underline" href={r.url} target="_blank">{r.title}</a></td>
              <td className="font-mono text-xs">{r.hash.slice(0,8)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

### F2. Entity: apps/web/src/app/entity/[slug]/page.tsx
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: { slug: string } }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/entities/${params.slug}`, { cache: 'no-store' });
  const { entity, receipts } = await res.json();
  if (!entity) return <main className="p-6">Not found.</main>;
  return (
    <main className="mx-auto max-w-[900px] p-6">
      <h1 className="text-xl font-semibold">{entity.name}</h1>
      <p className="text-sm text-gray-700">{receipts.length} receipts linked</p>
      <h2 className="mt-4 font-semibold">Timeline</h2>
      <ul className="list-disc ml-5">
        {receipts.slice(0,15).map((r:any)=>(
          <li key={r.id}>
            {new Date(r.published_at).toISOString().slice(0,10)} — {r.source} — <a className="underline" href={r.url} target="_blank">{r.title}</a>
          </li>
        ))}
      </ul>
      <form action="/api/ask" method="post" className="mt-6">
        <input type="hidden" name="entity" value={entity.slug}/>
        <textarea name="q" placeholder="Ask (demo, cites receipts)" className="w-full border p-2"></textarea>
      </form>
    </main>
  );
}
### F3. Brief/Enterprise/About — simple static shells pulling their APIs (you already have copy in agentpack).
### F4. Smoke Test

Open / and /entity/helion-energy locally, click 3 links.

## 7) Module G — Bulk Seed (looks big fast)
### G1. adapters/seed.csv (headers)
source,title,url,published_at,frontier,hash,summary,visible
OpenAlex,Sparse Autoencoders for...,https://openalex.org/works/W...,2025-11-03T10:00:00Z,AI,auto,Short one-liner,false
### G2. CSV → SQL: scripts/csv_to_sql.ts
import fs from 'node:fs'; import crypto from 'node:crypto';
const rows = fs.readFileSync('adapters/seed.csv','utf8').trim().split('\n').slice(1);
const esc = (s:string) => s.replaceAll("'", "''");
const values = rows.map(line=>{
  const parts = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/); // csv-safe split
  const [source,title,url,published_at,frontier,hash,summary,visible] = parts.map(s=>s.replace(/^"|"$/g,''));
  const h = hash==='auto' ? crypto.createHash('sha256').update(`${url}|${published_at}|${title}`).digest('hex') : hash;
  return `('${esc(source)}','${esc(title)}','${url}','${published_at}','${frontier}','${h}','${esc(summary||'')}',${visible==='true'})`;
}).join(',\n');
fs.writeFileSync('db/bulk_seed.sql', `insert into receipts (source,title,url,published_at,frontier,hash,summary,visible)\nvalues\n${values};\n`);
console.log('Wrote db/bulk_seed.sql');
### G3. Run & load
pnpm tsx scripts/csv_to_sql.ts
#paste db/bulk_seed.sql into Supabase → run
### G4. Smoke Test
curl -s http://localhost:3000/api/receipts/latest | jq length
#Expect >= 50 after promotion runs
## 8) Module H — Motion (Cron + client fallback)
### H1. vercel.json
{
  "crons": [
    { "path": "/api/cron/promote", "schedule": "*/1 * * * *" },
    { "path": "/api/cron/openalex", "schedule": "*/15 * * * *" }
  ]
}
### H2. Client fallback (optional)

If feed hasn’t changed in 90s, fire /api/cron/promote once from client.

### H3. Smoke Test
curl -s http://localhost:3000/api/cron/promote | jq .

## 9) Module I — Deploy (Vercel)
### I1. Init & push
git init && git add . && git commit -m "init"
#create repo on GitHub (or skip if already)
### I2. Vercel
vercel link
vercel env pull .env.local
vercel deploy --prod

Set custom domain thielverse.xyz → Vercel dashboard.
Confirm Crons visible in project settings.

### I3. Smoke Test (prod)
curl -s https://thielverse.xyz/api/receipts/latest | jq length
curl -s https://thielverse.xyz/api/entities/helion-energy | jq '.entity.slug'
## 10) Module J — QA & Hardening
### J1. Checklist

 Home < 2 s; counter moves ≤ 90 s

 ≥ 200 visible receipts; top 20 links OK

 Filters refilter; query param persists

 /api/receipts/latest JSON valid

 /entity/helion-energy renders; Ask returns text

 /brief renders four sections

 Mobile readable; no horiz scroll

 Grep bundles for secrets:

grep -R "SUPABASE_SERVICE_KEY" .next/ || echo "no leak"

### J2. Cut-scope levers

Drop Biotech; keep AI/Energy/Thielverse.

Brief uses static JSON.

Ask stays canned (no LLM).

## 11) Connector Map (how modules snap)
DB (Module C)
  ↑ seeds (C2,G)
API (Module E) → reads DB (anon) / writes via service (cron)
  ↑ Libs (Module D)
UI (Module F) → fetches API (read-only)
Cron (Module H) → flips visible; trickles OpenAlex (service)
Deploy (Module I) → exposes all + schedules crons
QA (Module J) → validates surfaces + no-secret rule

## 12) Copy Blocks (paste-ready)

Home tagline
Superintelligence is built from parts. We’re perfecting the verified memory of human progress.

Banner
Public memory is delayed 7 days. Real-time for Pro & Enterprise.

Footer
1 billion receipts • 1 year • open verifiable alive — receipts-in • bias-out © Frontier Index

## 13) Recovery Playbook (fast fixes)

No motion: hit /api/cron/promote manually; check Vercel Cron logs.

Dead links: swap top-20 in Supabase editor; no redeploy needed.

Anon write error: ensure writes only in /api/cron/* (service client).

Bundle leak fear: grep .next for SERVICE_KEY before prod.

