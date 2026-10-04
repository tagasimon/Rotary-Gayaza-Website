import "server-only";
import { db } from "./db";
import clubsList from "@/data/clubs.json";

export type Who = { members: number; guests: number; rotarians: number; rotaractors: number; prospects: number; total: number };
export const tally = (rows: { isGuest: boolean; affiliation: string | null; memberId: string | null; guestName: string | null; name: string | null }[]): Who => {
  const guest = (r: (typeof rows)[number]) => r.isGuest || (!r.memberId && !!r.guestName && !r.name);
  return {
    members: rows.filter((r) => !guest(r)).length,
    guests: rows.filter(guest).length,
    rotarians: rows.filter((r) => r.affiliation === "ROTARIAN").length,
    rotaractors: rows.filter((r) => r.affiliation === "ROTARACTOR").length,
    prospects: rows.filter((r) => r.affiliation === "PROSPECT").length,
    total: rows.length,
  };
};

export async function meetingsWithCounts(take = 60) {
  const meetings = await db.meeting.findMany({
    where: { records: { some: {} } }, orderBy: { date: "desc" }, take,
    include: { records: { select: { isGuest: true, affiliation: true, memberId: true, guestName: true, name: true, clubName: true, guestClub: true } } },
  });
  return meetings.map((m) => ({
    id: m.id, title: m.title, date: m.date, guestCount: m.guestCount, ...tally(m.records),
    clubs: [...new Set(m.records.filter((r) => r.isGuest || (!r.memberId && !!r.guestName && !r.name)).map((r) => (r.clubName || r.guestClub || "").trim()).filter(Boolean))],
  }));
}

export const displayName = (r: { name: string | null; guestName: string | null; member?: { fullName: string } | null }) => r.name || r.member?.fullName || r.guestName || "—";

/* ── Guests by club ─────────────────────────────────────────────────────────── */
const CLUB_INDEX = new Map((clubsList as { name: string; district: string; type: string }[]).map((c) => [c.name.toLowerCase(), c]));

export type GuestRow = { memberId?: string | null; clubName: string | null; guestClub?: string | null; isGuest: boolean; affiliation: string | null; email: string | null; phone: string | null; name: string | null; guestName?: string | null };
export type ClubTally = { club: string; type: "Rotary" | "Rotaract" | "Other"; district: string | null; visits: number; people: number; rotarians: number; rotaractors: number; lastSeen?: Date };

/** Groups guest sign-ins by the club they came from (case-insensitive), most visits first. */
export function guestsByClub(rows: (GuestRow & { date?: Date })[]): ClubTally[] {
  const map = new Map<string, ClubTally & { ids: Set<string> }>();
  for (const r of rows) {
    const legacyGuest = !r.memberId && !!r.guestName && !r.name;
    if (!r.isGuest && !legacyGuest) continue;
    if (r.affiliation === "PROSPECT") continue; // prospects have no club
    const raw = (r.clubName || r.guestClub || "").trim();
    const name = raw || "Club not given";
    const key = name.toLowerCase().replace(/\s+/g, " ");
    const known = CLUB_INDEX.get(key);
    const type = known ? (known.type === "ROTARACT" ? "Rotaract" : "Rotary") : /rotaract/i.test(name) ? "Rotaract" : /rotary/i.test(name) ? "Rotary" : "Other";
    const t = map.get(key) ?? { club: known?.name ?? name, type, district: known?.district ?? null, visits: 0, people: 0, rotarians: 0, rotaractors: 0, ids: new Set<string>() };
    t.visits++;
    if (r.affiliation === "ROTARIAN") t.rotarians++;
    if (r.affiliation === "ROTARACTOR") t.rotaractors++;
    t.ids.add((r.email || r.phone || r.name || r.guestName || "?").toLowerCase());
    if (r.date && (!t.lastSeen || r.date > t.lastSeen)) t.lastSeen = r.date;
    map.set(key, t);
  }
  return [...map.values()].map(({ ids, ...t }) => ({ ...t, people: ids.size })).sort((a, b) => b.visits - a.visits || a.club.localeCompare(b.club));
}

export async function guestClubReport(since?: Date) {
  const rows = await db.attendanceRecord.findMany({
    where: { OR: [{ isGuest: true }, { memberId: null, guestName: { not: null }, name: null }], ...(since ? { meeting: { date: { gte: since } } } : {}) },
    select: { memberId: true, clubName: true, guestClub: true, isGuest: true, affiliation: true, email: true, phone: true, name: true, guestName: true, meeting: { select: { date: true } } },
  });
  return guestsByClub(rows.map((r) => ({ ...r, date: r.meeting?.date })));
}
