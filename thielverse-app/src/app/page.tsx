export const dynamic = 'force-dynamic';

async function getData(frontier?: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const u = new URL(`${base}/api/receipts/enriched`);
  if (frontier) u.searchParams.set('frontier', frontier);
  u.searchParams.set('limit', '50');
  const res = await fetch(u.toString(), { cache: 'no-store' });
  return res.json();
}

export default async function Page(props: { searchParams: Promise<{ frontier?: string }> }) {
  const { frontier: f } = await props.searchParams; // Next 15: unwrap Promise
  const data = await getData(f);
  const fronts = ['AI','Energy','Biotech','Thielverse'];

  return (
    <main className="mx-auto max-w-[900px] p-6">
      <h1 className="text-xl font-semibold">Frontier Feed</h1>
      <p className="text-sm mt-1">{Array.isArray(data)?data.length:0} receipts • public is 7-day delayed</p>

      <div className="mt-3 space-x-3">
        {fronts.map(x => (
          <a key={x} href={`/?frontier=${x}`} className={`underline ${x===f?'font-semibold':''}`}>{x}</a>
        ))}
        <a href="/" className={!f?'font-semibold underline':'underline'}>All</a>
      </div>

      <AskBox className="mt-6" />

      <table className="w-full mt-4 text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Date</th><th>Frontier</th><th>Source</th><th>Title</th><th>Entities</th>
          </tr>
        </thead>
        <tbody>
          {(Array.isArray(data)?data:[]).map((r:any)=>(
            <tr key={r.id} className="border-b">
              <td className="py-2">{new Date(r.published_at).toISOString().slice(0,10)}</td>
              <td>{r.frontier || '-'}</td>
              <td>{r.source}</td>
              <td><a className="underline" href={r.url} target="_blank">{r.title}</a></td>
              <td className="space-x-2">
                {(r.entities||[]).map((e:any)=>(
                  <a key={e.slug} className="underline" href={`/entity/${e.slug}`}>{e.name}</a>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

/* local import without alias */
import AskBox from "./_askbox";
