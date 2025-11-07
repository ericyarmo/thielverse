export const dynamic = "force-dynamic";

import Counter from "./_counter";
import AskBox from "./_askbox";

async function getData(frontier?: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const u = new URL(`${base}/api/receipts/enriched`);
  if (frontier) u.searchParams.set("frontier", frontier);
  u.searchParams.set("limit", "50");
  const r = await fetch(u.toString(), { cache: "no-store" });
  return r.json();
}

export default async function Page(props: { searchParams: Promise<{ frontier?: string }> }) {
  const { frontier: f } = await props.searchParams;
  const rows: any[] = await getData(f);
  const fronts = ["AI", "Energy", "Biotech", "Thielverse"];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/20 p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Frontier Feed</h1>
        <p className="text-sm text-neutral-400 mt-1">
          {Array.isArray(rows) ? rows.length : 0} receipts • public is 7-day delayed
        </p>
        <Counter />
        <div className="mt-4 flex flex-wrap gap-2">
          {fronts.map(x => {
            const active = x === f;
            return (
              <a
                key={x}
                href={`/?frontier=${x}`}
                className={`px-3 py-1.5 rounded-full text-sm border transition ${
                  active
                    ? "bg-teal-600/20 border-teal-500 text-teal-300"
                    : "border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900"
                }`}
              >
                {x}
              </a>
            );
          })}
          <a
            href="/"
            className={`px-3 py-1.5 rounded-full text-sm border transition ${
              !f
                ? "bg-teal-600/20 border-teal-500 text-teal-300"
                : "border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900"
            }`}
          >
            All
          </a>
        </div>
        <AskBox className="mt-4" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-800">
        <table className="w-full text-[13.5px] leading-5">
          <thead className="bg-neutral-900/60 text-neutral-300">
            <tr>
              <th className="px-4 py-3 text-left w-[110px]">Date</th>
              <th className="px-4 py-3 text-left w-[110px]">Frontier</th>
              <th className="px-4 py-3 text-left w-[100px]">Source</th>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left w-[260px]">Entities</th>
            </tr>
          </thead>
          <tbody>
            {(Array.isArray(rows) ? rows : []).map(r => (
              <tr key={r.id} className="border-t border-neutral-850 hover:bg-neutral-900/40">
                <td className="px-4 py-3 align-top tabular-nums">{new Date(r.published_at).toISOString().slice(0,10)}</td>
                <td className="px-4 py-3 align-top">
                  <span className="rounded-md border border-neutral-800 px-2 py-0.5 text-xs text-neutral-300">{r.frontier}</span>
                </td>
                <td className="px-4 py-3 align-top text-neutral-300">{r.source}</td>
                <td className="px-4 py-3 align-top">
                  <a className="underline decoration-neutral-500 hover:decoration-teal-400" href={r.url} target="_blank" rel="noreferrer">
                    {r.title}
                  </a>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-wrap gap-2">
                    {(r.entities || []).map((e: any) => (
                      <a
                        key={e.slug}
                        href={`/entity/${e.slug}`}
                        className="rounded-md border border-neutral-800 px-2 py-1 hover:border-neutral-700 hover:bg-neutral-900"
                      >
                        {e.name}
                      </a>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {(!rows || rows.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-neutral-400">
                  No receipts yet. Seed a few and refresh.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
