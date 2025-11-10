"use client";

import { usePathname } from "next/navigation";

export default function ViewControls({
  limit,
  sort,
  frontier,
}: {
  limit?: string;
  sort?: string;
  frontier?: string;
}) {
  const pathname = usePathname();
  const currentLimit = limit || "50";
  const currentSort = sort || "desc";

  // colors
  const BLACK = "#000000";
  const WHITE = "#ffffff";
  const GREEN = "#22c55e";      // tailwind green-500
  const GREEN_HOVER = "#16a34a"; // tailwind green-600

  // shared pill style
  const pillStyle = (isActive: boolean) =>
    ({
      padding: "0.375rem 0.75rem",
      fontSize: "0.75rem",
      borderRadius: "9999px",
      border: `1px solid ${BLACK}`,
      background: isActive ? GREEN : BLACK,
      color: WHITE,
      textDecoration: "none",
      transition: "background 120ms ease, transform 120ms ease",
      fontWeight: 600,
      lineHeight: 1,
      display: "inline-block",
    } as const);

  const onHover = (e: React.MouseEvent<HTMLAnchorElement>, isActive: boolean) => {
    if (isActive) return;
    e.currentTarget.style.background = GREEN_HOVER;
    e.currentTarget.style.transform = "translateY(-1px)";
  };

  const onLeave = (e: React.MouseEvent<HTMLAnchorElement>, isActive: boolean) => {
    if (isActive) return;
    e.currentTarget.style.background = BLACK;
    e.currentTarget.style.transform = "translateY(0)";
  };

  const buildUrl = (newParams: { limit?: string; sort?: string }) => {
    const params = new URLSearchParams();
    if (frontier) params.set("f", frontier);
    if (newParams.limit) params.set("limit", newParams.limit);
    if (newParams.sort) params.set("sort", newParams.sort);
    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  };

  const limits = [
    { value: "25", label: "25" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
    { value: "200", label: "All" },
  ];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
      {/* Limit toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.75rem", color: "rgba(0, 0, 0, 0.7)" }}>
          Show:
        </span>
        <div style={{ display: "flex", gap: "0.375rem" }}>
          {limits.map((l) => {
            const isActive = currentLimit === l.value;
            return (
              <a
                key={l.value}
                href={buildUrl({ limit: l.value, sort: currentSort })}
                style={pillStyle(isActive)}
                onMouseEnter={(e) => onHover(e, isActive)}
                onMouseLeave={(e) => onLeave(e, isActive)}
              >
                {l.label}
              </a>
            );
          })}
        </div>
      </div>

      {/* Sort toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.75rem", color: "rgba(0, 0, 0, 0.7)" }}>
          Sort:
        </span>
        <div style={{ display: "flex", gap: "0.375rem" }}>
          {[
            { value: "desc", label: "Newest" },
            { value: "asc", label: "Oldest" },
          ].map((opt) => {
            const isActive = currentSort === opt.value;
            return (
              <a
                key={opt.value}
                href={buildUrl({ limit: currentLimit, sort: opt.value })}
                style={pillStyle(isActive)}
                onMouseEnter={(e) => onHover(e, isActive)}
                onMouseLeave={(e) => onLeave(e, isActive)}
              >
                {opt.label}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
