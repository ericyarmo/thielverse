export const dynamic = 'force-dynamic';

type EntityData = {
  entity: { slug: string; name: string; kind: string };
  receipts: { id: string; title: string; url: string; source: string; published_at: string; frontier: string }[];
};

async function fetchEntity(slug: string): Promise<EntityData | null> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/entities/${slug}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export default async function EntityPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const data = await fetchEntity(slug);
  if (!data) return <main className="p-6">Not found.</main>;

  return (
    <main className="mx-auto max-w-[900px] p-6">
      <h1 className="text-xl font-semibold">{data.entity.name}</h1>
      <p className="text-sm text-gray-300">{data.entity.kind}</p>
      <ul className="mt-4 space-y-2">
        {data.receipts.map(r => (
          <li key={r.id} className="border-b pb-2">
            <div className="text-xs">{new Date(r.published_at).toISOString().slice(0,10)} • {r.frontier} • {r.source}</div>
            <a className="underline" href={r.url} target="_blank" rel="noreferrer">{r.title}</a>
          </li>
        ))}
      </ul>
      <div className="mt-6"><a className="underline" href="/">← Back to feed</a></div>
    </main>
  );
}
