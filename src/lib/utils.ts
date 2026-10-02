export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export const SITE_URL = () => (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

export function absUrl(p: string) {
  if (/^https?:\/\//.test(p)) return p;
  return SITE_URL() + (p.startsWith("/") ? p : "/" + p);
}

export function hostOf(url?: string | null) {
  if (!url) return "";
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

export function excerpt(md: string | null | undefined, n = 180) {
  if (!md) return "";
  const t = md.replace(/[#*_>`\[\]]/g, "").replace(/\(https?:[^)]+\)/g, "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;
}
