import "server-only";
import { db } from "./db";
import { localParts } from "./time";
import { rotaryYearOf } from "./rotary-year";

/** Club-local midnight for a date */
function dayStart(d: Date) {
  return new Date(`${localParts(d).ymd}T00:00:00+03:00`);
}

/**
 * The meeting people are signing in to: today's meeting if one exists, otherwise one is created
 * automatically. Fellowship is every Sunday; on other days a "Club gathering" is created so a
 * special event still gets recorded. If the club published an event for today, it is linked.
 */
export async function getOrCreateTodayMeeting(now = new Date()) {
  const start = dayStart(now);
  const end = new Date(start.getTime() + 864e5);
  const existing = await db.meeting.findFirst({ where: { date: { gte: start, lt: end } }, orderBy: { date: "asc" } });
  if (existing) return existing;
  const [club, event] = await Promise.all([
    db.club.findFirst({ where: { isHome: true } }),
    db.event.findFirst({ where: { status: "APPROVED", scope: "CLUB", startsAt: { gte: start, lt: end } }, orderBy: [{ featured: "desc" }, { startsAt: "asc" }] }),
  ]);
  const sunday = new Date(`${localParts(now).ymd}T12:00:00+03:00`).getUTCDay() === 0;
  const date = event?.startsAt ?? new Date(`${localParts(now).ymd}T17:00:00+03:00`);
  try {
    return await db.meeting.create({
      data: {
        title: event?.title ?? (sunday ? "Sunday fellowship" : "Club gathering"),
        type: event?.type === "DG_VISIT" ? "DG_VISIT" : sunday ? "FELLOWSHIP" : "SPECIAL",
        date, rotaryYear: rotaryYearOf(date), venue: event?.venue ?? club?.venue ?? null, eventId: event?.id ?? null,
      },
    });
  } catch {
    // two people signing in at the same instant — use whichever was created
    return (await db.meeting.findFirst({ where: { date: { gte: start, lt: end } }, orderBy: { date: "asc" } }))!;
  }
}

export const normPhone = (p: string) => {
  const d = p.replace(/[^\d+]/g, "");
  if (/^0\d{9}$/.test(d)) return "+256" + d.slice(1); // Ugandan local format
  if (/^256\d{9}$/.test(d)) return "+" + d;
  return d;
};

export type CheckInInput = { name: string; email: string; phone: string; isGuest: boolean; affiliation: "ROTARIAN" | "ROTARACTOR" | "PROSPECT"; clubName: string | null };

/** Records a sign-in; signing in twice on the same day updates the first record instead of duplicating. */
export async function recordCheckIn(input: CheckInInput) {
  const meeting = await getOrCreateTodayMeeting();
  const email = input.email.trim().toLowerCase();
  const phone = normPhone(input.phone);
  const existing = await db.attendanceRecord.findFirst({
    where: { meetingId: meeting.id, OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])] },
  });
  // link to the member directory when a club member's email or phone matches
  let memberId: string | null = null;
  if (!input.isGuest) {
    const m = await db.member.findFirst({
      where: { status: { in: ["ACTIVE", "HONORARY"] }, OR: [...(email ? [{ email: { equals: email, mode: "insensitive" as const } }] : []), ...(phone ? [{ phone }] : [])] },
      select: { id: true },
    });
    if (m) {
      const taken = await db.attendanceRecord.findFirst({ where: { meetingId: meeting.id, memberId: m.id }, select: { id: true } });
      if (!taken || taken.id === existing?.id) memberId = m.id;
    }
  }
  const data = {
    name: input.name.trim(), email: email || null, phone: phone || null, isGuest: input.isGuest, affiliation: input.affiliation,
    clubName: input.isGuest ? input.clubName : "Rotary Club of Gayaza", memberId, method: "QR" as const, status: "PRESENT" as const,
  };
  const record = existing
    ? await db.attendanceRecord.update({ where: { id: existing.id }, data })
    : await db.attendanceRecord.create({ data: { ...data, meetingId: meeting.id } });
  return { meeting, record, duplicate: !!existing };
}
