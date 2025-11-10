// src/app/components/FilterPills.tsx

export default function FilterPills({
  items,
  active,
}: {
  items: { key?: string; label: string }[];
  active?: string;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
      {items.map((i) => {
        const isActive = active === (i.key ?? undefined);
        const href = i.key ? `/?f=${encodeURIComponent(i.key)}` : "/";

        return (
          <a
            key={i.label}
            href={href}
            className={`filter-pill ${isActive ? 'active' : ''}`}
          >
            {i.label}
          </a>
        );
      })}
    </div>
  );
}
