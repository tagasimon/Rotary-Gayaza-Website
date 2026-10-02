// Uganda observes EAT (UTC+3) all year — no daylight saving.
export const CLUB_TZ = process.env.CLUB_TIMEZONE || "Africa/Kampala";
export const CLUB_OFFSET = process.env.CLUB_UTC_OFFSET || "+03:00";

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: CLUB_TZ, ...opts });

export function formatDate(d: Date | string | null | undefined, style: "long" | "short" | "day" = "long") {
  if (!d) return "";
  const date = new Date(d);
  if (style === "short") return fmt({ day: "numeric", month: "short", year: "numeric" }).format(date);
  if (style === "day") return fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);
  return fmt({ day: "numeric", month: "long", year: "numeric" }).format(date);
}

export function formatTime(d: Date | string | null | undefined) {
  if (!d) return "";
  return new Intl.DateTimeFormat("en-US", { timeZone: CLUB_TZ, hour: "numeric", minute: "2-digit" }).format(new Date(d));
}

export function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return "";
  return `${formatDate(d, "short")}, ${formatTime(d)}`;
}

/** Parts of a date in club local time */
export function localParts(d: Date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: CLUB_TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
    }).formatToParts(d).map((x) => [x.type, x.value]),
  );
  return { y: +p.year, m: +p.month, d: +p.day, hh: +p.hour % 24, mm: +p.minute, ymd: `${p.year}-${p.month}-${p.day}` };
}

export function sameLocalDay(a: Date, b: Date) {
  return localParts(a).ymd === localParts(b).ymd;
}

/** "2026-10-11T15:00" (club local) -> Date */
export function fromLocalInput(v: string | null | undefined): Date | null {
  if (!v) return null;
  const s = v.length === 10 ? `${v}T00:00` : v;
  const d = new Date(`${s.slice(0, 16)}:00${CLUB_OFFSET}`);
  return isNaN(+d) ? null : d;
}

/** Date -> "2026-10-11T15:00" in club local time, for datetime-local inputs */
export function toLocalInput(d: Date | string | null | undefined, dateOnly = false) {
  if (!d) return "";
  const p = localParts(new Date(d));
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = `${p.y}-${pad(p.m)}-${pad(p.d)}`;
  return dateOnly ? day : `${day}T${pad(p.hh)}:${pad(p.mm)}`;
}
