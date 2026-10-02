import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { rotaryYearOf, rotaryYearRange, currentRotaryYear } from "./rotary-year";
import { localParts } from "./time";

export type AttendanceFilters = { from?: Date | null; to?: Date | null; ry?: string; meetingId?: string; memberId?: string; status?: string };

export type MeetingRow = { id: string; title: string; date: Date; rotaryYear: string; present: number; guests: number; excused: number; absent: number; eligible: number; pct: number };
export type MemberRow = { id: string; name: string; number: string; status: string; attended: number; excused: number; available: number; pct: number; last: Date | null };

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);

/**
 * Attendance analytics computed from raw rows. A member is "available" for a meeting if they
 * were an active member who had joined by that date, or if they have a record for it (so members
 * who later left still count correctly for historical meetings).
 */
export async function attendanceAnalytics(filters: AttendanceFilters = {}) {
  let f = filters;
  const now = new Date();
  const where: Prisma.MeetingWhereInput = { countsTowardAttendance: true, status: { not: "ARCHIVED" }, date: { lte: now } };
  if (f.ry && !/^\d{4}-\d{2}$/.test(f.ry)) f = { ...f, ry: undefined };
  if (f.from && isNaN(+f.from)) f = { ...f, from: null };
  if (f.to && isNaN(+f.to)) f = { ...f, to: null };
  if (f.ry) { const r = rotaryYearRange(f.ry); where.date = { gte: r.start, lt: r.end, lte: now }; }
  if (f.from || f.to) where.AND = [{ date: { ...(f.from ? { gte: f.from } : {}), ...(f.to ? { lte: f.to } : {}) } }];
  if (f.meetingId) where.id = f.meetingId;

  const [meetings, members] = await Promise.all([
    db.meeting.findMany({ where, orderBy: { date: "asc" }, include: { records: true } }),
    db.member.findMany({ select: { id: true, fullName: true, memberNumber: true, status: true, joinDate: true, leftAt: true } }),
  ]);
  const activeNow = members.filter((m) => m.status === "ACTIVE");

  const perMeeting: MeetingRow[] = [];
  const memberStats = new Map<string, { attended: number; excused: number; available: number; last: Date | null }>();
  for (const m of members) memberStats.set(m.id, { attended: 0, excused: 0, available: 0, last: null });

  for (const mt of meetings) {
    const recByMember = new Map(mt.records.filter((r) => r.memberId).map((r) => [r.memberId!, r]));
    const eligibleIds = new Set<string>();
    for (const m of members) {
      // available = a member on that date: joined on/before it (or join date unknown) and not yet left.
      // Former members only count for history if their leave date is recorded.
      const joined = !m.joinDate || m.joinDate <= mt.date;
      const stillMember = m.leftAt ? mt.date < m.leftAt : m.status === "ACTIVE";
      if ((joined && stillMember) || recByMember.has(m.id)) eligibleIds.add(m.id);
    }
    let present = 0, excused = 0;
    for (const id of eligibleIds) {
      const s = memberStats.get(id)!;
      const r = recByMember.get(id);
      s.available++;
      if (r && (r.status === "PRESENT" || r.status === "MAKEUP")) { present++; s.attended++; if (!s.last || mt.date > s.last) s.last = mt.date; }
      else if (r?.status === "EXCUSED") { excused++; s.excused++; }
    }
    const guests = mt.records.filter((r) => !r.memberId).length + mt.guestCount;
    const eligible = eligibleIds.size;
    perMeeting.push({ id: mt.id, title: mt.title, date: mt.date, rotaryYear: mt.rotaryYear, present, guests, excused, absent: Math.max(0, eligible - present - excused), eligible, pct: pct(present, eligible) });
  }

  let perMember: MemberRow[] = members
    .map((m) => { const s = memberStats.get(m.id)!; return { id: m.id, name: m.fullName, number: m.memberNumber, status: m.status, attended: s.attended, excused: s.excused, available: s.available, pct: pct(s.attended, s.available), last: s.last }; })
    .filter((r) => r.available > 0 || r.status === "ACTIVE")
    .sort((a, b) => b.pct - a.pct || a.name.localeCompare(b.name));
  if (f.memberId) perMember = perMember.filter((r) => r.id === f.memberId);

  // Monthly (club local time) and by Rotary year
  const monthly = new Map<string, { present: number; eligible: number; meetings: number }>();
  const byRY = new Map<string, { present: number; eligible: number; meetings: number }>();
  for (const m of perMeeting) {
    const p = localParts(m.date);
    const key = `${p.y}-${String(p.m).padStart(2, "0")}`;
    for (const [map, k] of [[monthly, key], [byRY, m.rotaryYear]] as const) {
      const cur = map.get(k) ?? { present: 0, eligible: 0, meetings: 0 };
      cur.present += m.present; cur.eligible += m.eligible; cur.meetings++;
      map.set(k, cur);
    }
  }

  const totalPresent = perMeeting.reduce((a, m) => a + m.present, 0);
  const totalEligible = perMeeting.reduce((a, m) => a + m.eligible, 0);
  const thisMonthKey = (() => { const p = localParts(now); return `${p.y}-${String(p.m).padStart(2, "0")}`; })();

  // headline figures always describe the club regardless of filters (except where noted)
  const ry = currentRotaryYear();
  const ryMeetings = f.ry || f.from || f.to || f.meetingId ? null : perMeeting.filter((m) => m.rotaryYear === ry);
  const tm = monthly.get(thisMonthKey);
  const ryAgg = ryMeetings ? ryMeetings.reduce((a, m) => ({ p: a.p + m.present, e: a.e + m.eligible }), { p: 0, e: 0 }) : null;

  return {
    totals: {
      totalMembers: members.filter((m) => m.status !== "LEFT").length,
      activeMembers: activeNow.length,
      meetingsHeld: perMeeting.length,
      averageAttendance: pct(totalPresent, totalEligible),
      averagePresent: perMeeting.length ? Math.round((totalPresent / perMeeting.length) * 10) / 10 : 0,
      thisMonth: tm ? pct(tm.present, tm.eligible) : null,
      thisRotaryYear: ryAgg ? pct(ryAgg.p, ryAgg.e) : null,
      currentRotaryYear: ry,
    },
    perMeeting,
    perMember,
    monthly: [...monthly].map(([month, v]) => ({ month, pct: pct(v.present, v.eligible), meetings: v.meetings, avgPresent: Math.round((v.present / v.meetings) * 10) / 10 })),
    byRotaryYear: [...byRY].map(([ry, v]) => ({ ry, pct: pct(v.present, v.eligible), meetings: v.meetings })).sort((a, b) => a.ry.localeCompare(b.ry)),
  };
}

export async function rotaryYearsWithMeetings() {
  const rows = await db.meeting.findMany({ distinct: ["rotaryYear"], select: { rotaryYear: true }, orderBy: { rotaryYear: "desc" } });
  const cur = currentRotaryYear();
  const set = new Set(rows.map((r) => r.rotaryYear));
  set.add(cur);
  return [...set].sort().reverse();
}

export { rotaryYearOf };
