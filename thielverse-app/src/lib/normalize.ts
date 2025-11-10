import crypto from "crypto";

export function toISO(x: any): string {
  try { return new Date(x).toISOString(); } catch { return new Date().toISOString(); }
}
export function canonUrl(u: string): string {
  try {
    const url = new URL(u);
    url.hash = ""; // drop fragments
    if (url.searchParams.has("utm_source")) url.searchParams.delete("utm_source");
    if (url.searchParams.has("utm_medium")) url.searchParams.delete("utm_medium");
    if (url.searchParams.has("utm_campaign")) url.searchParams.delete("utm_campaign");
    return url.toString();
  } catch { return u; }
}
export function hashV1(url: string, publishedAtISO: string, title: string): string {
  const s = `tvfi:v1|${canonUrl(url)}|${publishedAtISO}|${title.trim()}`;
  return crypto.createHash("sha256").update(s).digest("hex");
}

export type Norm = {
  source: string; title: string; url: string; published_at: string;
  frontier?: string; hash: string; summary?: string; visible: boolean;
};

export function normalizeReceipt(source: string, frontier: string, title: string, url: string, publishedAt: any): Norm {
  const published_at = toISO(publishedAt);
  const h = hashV1(url, published_at, title || "(untitled)");
  return { source, title: title?.trim() || "(untitled)", url: canonUrl(url), published_at, frontier, hash: h, visible: true };
}
