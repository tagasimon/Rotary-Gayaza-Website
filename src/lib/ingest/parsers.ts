import * as cheerio from "cheerio";

export type ParsedEvent = { externalId: string; title: string; startsAt: Date; endsAt?: Date | null; venue?: string | null; description?: string | null; url?: string | null; imageUrl?: string | null; organiser?: string | null; timeTbc?: boolean };
export type ParsedItem = { externalId: string; title: string; url: string; date?: Date | null; summary?: string | null; imageUrl?: string | null };

const MONTHS: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };
const pad = (n: number) => String(n).padStart(2, "0");

/** Club-local (EAT, UTC+3) wall time -> Date */
function eat(y: number, m: number, d: number, hh = 12, mm = 0) {
  return new Date(`${y}-${pad(m + 1)}-${pad(d)}T${pad(hh)}:${pad(mm)}:00+03:00`);
}

/** "Oct. 11, 2026 3:00 p.m." | "Oct 2, 2026" | "Jul 27, 2025" */
export function parseHumanDate(s: string): { date: Date; hasTime: boolean } | null {
  const m = s.replace(/\s+/g, " ").trim().match(/([A-Za-z]{3,9})\.?\s+(\d{1,2}),\s*(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*([ap])\.?m\.?)?/i);
  if (!m) return null;
  const mon = MONTHS[m[1].slice(0, m[1].toLowerCase().startsWith("sept") ? 4 : 3).toLowerCase()];
  if (mon === undefined) return null;
  if (!m[4]) return { date: eat(+m[3], mon, +m[2]), hasTime: false };
  let hh = +m[4] % 12;
  if (m[6].toLowerCase() === "p") hh += 12;
  return { date: eat(+m[3], mon, +m[2], hh, +m[5]), hasTime: true };
}

// ── iCalendar (RFC 5545) — minimal, robust parser for VEVENTs ──
function unfold(ics: string) { return ics.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, ""); }
function icsText(v: string) { return v.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\;/g, ";").replace(/\\\\/g, "\\").trim(); }
function icsDate(v: string, params: string): { date: Date; allDay: boolean } | null {
  const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!m) return null;
  if (!m[4]) return { date: eat(+m[1], +m[2] - 1, +m[3], 0, 0), allDay: true };
  const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`;
  // UTC when "Z"; otherwise floating/TZID — ClubRunner uses Z, but treat others as club local time
  return { date: new Date(m[7] ? `${iso}Z` : `${iso}+03:00`), allDay: false && !!params };
}

export function parseIcs(ics: string): (ParsedEvent & { allDay: boolean })[] {
  const out: (ParsedEvent & { allDay: boolean })[] = [];
  for (const block of unfold(ics).split("BEGIN:VEVENT").slice(1)) {
    const body = block.split("END:VEVENT")[0];
    const props: Record<string, { v: string; p: string }> = {};
    for (const line of body.split("\n")) {
      const i = line.indexOf(":");
      if (i < 1) continue;
      const [name, ...params] = line.slice(0, i).split(";");
      props[name.toUpperCase()] ??= { v: line.slice(i + 1), p: params.join(";") };
    }
    const uid = props.UID?.v, summary = props.SUMMARY ? icsText(props.SUMMARY.v) : "";
    const start = props.DTSTART && icsDate(props.DTSTART.v.trim(), props.DTSTART.p);
    if (!uid || !summary || !start) continue;
    const end = props.DTEND && icsDate(props.DTEND.v.trim(), props.DTEND.p);
    out.push({ externalId: uid.trim(), title: summary, startsAt: start.date, endsAt: end && end.date > start.date ? end.date : null, venue: props.LOCATION ? icsText(props.LOCATION.v) || null : null,
      description: props.DESCRIPTION ? icsText(props.DESCRIPTION.v) || null : null, url: props.URL?.v.trim() || null, allDay: start.allDay });
  }
  return out;
}

// ── District 9213 (ClubRunner) homepage "Upcoming Events" list ──
export function parseD9213Home(html: string): ParsedEvent[] {
  const $ = cheerio.load(html);
  const out: ParsedEvent[] = [];
  $("a.event-name").each((_, a) => {
    const el = $(a);
    const li = el.closest("li");
    const href = el.attr("href") ?? "";
    const slug = href.split("/Event/")[1]?.replace(/\/$/, "") ?? href;
    const d = parseHumanDate(li.find(".event-date").text());
    if (!slug || !d) return;
    out.push({ externalId: slug.toLowerCase(), title: el.text().trim(), startsAt: d.date, timeTbc: !d.hasTime, venue: li.find(".event-location").text().trim() || null, url: `https://rotaryd9213.org/event/${slug.toLowerCase()}/` });
  });
  return out;
}

// ── District 9213 stories list ──
export function parseD9213Stories(html: string): ParsedItem[] {
  const $ = cheerio.load(html);
  const out: ParsedItem[] = [];
  $("article.list-item").each((_, art) => {
    const a = $(art).find("a.title").first();
    const href = a.attr("href");
    if (!href) return;
    const meta = $(art).find(".list-text-meta").text();
    const d = parseHumanDate(meta.split(" on ").pop() ?? "");
    const url = new URL(href, "https://rotaryd9213.org/").toString();
    out.push({ externalId: url, title: a.text().replace(/\s+/g, " ").trim(), url, date: d?.date ?? null, summary: $(art).find(".list-text").text().replace(/\s+/g, " ").trim().slice(0, 400) || null, imageUrl: $(art).find("img").attr("data-src") ?? $(art).find("img").attr("src") ?? null });
  });
  return out;
}

// ── District 9213 photo album list ──
export function parseD9213Albums(html: string): ParsedItem[] {
  const $ = cheerio.load(html);
  const out: ParsedItem[] = [];
  $("td.album-item").each((_, td) => {
    const row = $(td).closest("tr");
    const a = $(td).find(".album-title a").first();
    const href = a.attr("href");
    if (!href) return;
    const url = new URL(href, "https://rotaryd9213.org/").toString();
    const d = parseHumanDate(row.find(".PhotoAlbumListDate").text());
    out.push({ externalId: url, title: a.text().trim(), url, date: d?.date ?? null, imageUrl: $(td).find("img").attr("data-src") ?? null, summary: $(td).find(".album-description").text().trim() || null });
  });
  return out;
}

/** Full-size image URLs embedded in a ClubRunner album page (inline JS: image: '...') */
export function parseD9213AlbumImages(html: string): string[] {
  return [...new Set([...html.matchAll(/image:\s*'([^']+)'/g)].map((m) => m[1]).filter((u) => /^https:\/\/clubrunner\.blob\.core\.windows\.net\//.test(u)))];
}

// ── Rotary-O fellowships ──
export function parseRotaryO(html: string): ParsedEvent[] {
  const $ = cheerio.load(html);
  const out: ParsedEvent[] = [];
  $("div[data-key]").each((_, card) => {
    const c = $(card);
    const id = c.attr("data-key");
    const img = c.find("img.fc-img");
    const title = (img.attr("alt") || c.find(".mc-name").text()).trim();
    const rows = c.find(".mc-row span").map((__, s) => $(s).text().replace(/\s+/g, " ").trim()).get();
    const dateRow = rows.find((r) => parseHumanDate(r));
    const d = dateRow ? parseHumanDate(dateRow) : null;
    if (!id || !title || !d) return;
    const clubRow = rows.find((r) => r !== dateRow);
    const src = img.attr("src");
    out.push({ externalId: id, title, startsAt: d.date, timeTbc: !d.hasTime, organiser: clubRow ? clubRow.replace(/\s*·\s*/, " · ") : null, url: `https://www.rotaryo.org/search/fellowship?id=${id}`, imageUrl: src ? new URL(encodeURI(src), "https://www.rotaryo.org/").toString() : null });
  });
  return out;
}

// ── Generic page (Import from URL): Open Graph + JSON-LD ──
export function parseGenericPage(html: string, url: string) {
  const $ = cheerio.load(html);
  const meta = (p: string) => $(`meta[property="${p}"],meta[name="${p}"]`).attr("content")?.trim() || null;
  let startDate: string | null = null, published: string | null = null, location: string | null = null, ldType: string | null = null;
  $('script[type="application/ld+json"]').each((_, s) => {
    try {
      const data = JSON.parse($(s).text());
      for (const node of ([] as Record<string, unknown>[]).concat(data["@graph"] ?? data)) {
        const t = String(node["@type"] ?? "");
        if (/Event/.test(t)) { ldType = "Event"; startDate ??= String(node.startDate ?? "") || null; const loc = node.location as Record<string, unknown> | undefined; location ??= loc ? String(loc.name ?? "") || null : null; }
        if (/Article|BlogPosting|NewsArticle/.test(t)) { ldType ??= "Article"; published ??= String(node.datePublished ?? "") || null; }
      }
    } catch { /* ignore malformed JSON-LD */ }
  });
  return {
    title: meta("og:title") || $("title").first().text().trim() || url,
    description: meta("og:description") || meta("description"),
    image: meta("og:image"),
    startDate: startDate ? new Date(startDate) : null,
    published: published ? new Date(published) : meta("article:published_time") ? new Date(meta("article:published_time")!) : null,
    location, ldType,
  };
}
