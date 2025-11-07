export const dynamic = 'force-dynamic';

async function getEntity(slug: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/entities/${slug}`, { cache: 'no-store' });
  return res.json();
}

export default async function Page({ params }: { params: { slug: string } }) {
  const { entity, receipts, error } = await getEntity(params.slug);
  if (error) return <main className="p-6">Error: {error}</main>;
  if (!entity) return <main className="p-6">Not found.</main>;
  return (
    <main className="mx-auto max-w-[900px] p-6">
      <a className="underline text-sm" href="/">← Back</a>
      <h1 className="text-xl font-semibold mt-2">{entity.name}</h1>
      <p className="text-sm text-gray-700">{(receipts||[]).length} receipts linked</p>
      <h2 className="mt-4 font-semibold">Timeline</h2>
      <ul className="list-disc ml-5">
        {(receipts||[]).slice(0,15).map((r:any)=>(
          <li key={r.id}>
            {new Date(r.published_at).toISOString().slice(0,10)} — {r.source} — <a className="underline" href={r.url} target="_blank">{r.title}</a>
          </li>
        ))}
      </ul>
      <div className="mt-6 text-sm border-t pt-4">
        <div className="font-semibold mb-1">Ask (demo):</div>
        <div>Explain this entity’s recent progress. (Canned via receipts — wire later)</div>
      </div>
    </main>
  );
}
