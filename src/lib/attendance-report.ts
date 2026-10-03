import "server-only";
import { db } from "./db";

export type Who = { members: number; guests: number; rotarians: number; rotaractors: number; total: number };
export const tally = (rows: { isGuest: boolean; affiliation: string | null; memberId: string | null; guestName: string | null; name: string | null }[]): Who => {
  const guest = (r: (typeof rows)[number]) => r.isGuest || (!r.memberId && !!r.guestName && !r.name);
  return {
    members: rows.filter((r) => !guest(r)).length,
    guests: rows.filter(guest).length,
    rotarians: rows.filter((r) => r.affiliation === "ROTARIAN").length,
    rotaractors: rows.filter((r) => r.affiliation === "ROTARACTOR").length,
    total: rows.length,
  };
};

export async function meetingsWithCounts(take = 60) {
  const meetings = await db.meeting.findMany({
    where: { records: { some: {} } }, orderBy: { date: "desc" }, take,
    include: { records: { select: { isGuest: true, affiliation: true, memberId: true, guestName: true, name: true } } },
  });
  return meetings.map((m) => ({ id: m.id, title: m.title, date: m.date, guestCount: m.guestCount, ...tally(m.records) }));
}

export const displayName = (r: { name: string | null; guestName: string | null; member?: { fullName: string } | null }) => r.name || r.member?.fullName || r.guestName || "—";
