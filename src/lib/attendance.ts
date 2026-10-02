import "server-only";
import { db } from "./db";

export type SessionState =
  | { kind: "invalid" }
  | { kind: "revoked"; meeting: MeetingLite }
  | { kind: "not-open"; opensAt: Date; meeting: MeetingLite }
  | { kind: "closed"; meeting: MeetingLite }
  | { kind: "open"; sessionId: string; allowGuests: boolean; closesAt: Date; meeting: MeetingLite };

type MeetingLite = { id: string; title: string; date: Date; venue: string | null; type: string };

export async function resolveAttendanceToken(token: string): Promise<SessionState> {
  if (!/^[A-Za-z0-9_-]{30,64}$/.test(token)) return { kind: "invalid" };
  const s = await db.attendanceSession.findUnique({ where: { token }, include: { meeting: { select: { id: true, title: true, date: true, venue: true, type: true } } } });
  if (!s) return { kind: "invalid" };
  if (s.revokedAt) return { kind: "revoked", meeting: s.meeting };
  const now = new Date();
  if (now < s.opensAt) return { kind: "not-open", opensAt: s.opensAt, meeting: s.meeting };
  if (now > s.closesAt) return { kind: "closed", meeting: s.meeting };
  return { kind: "open", sessionId: s.id, allowGuests: s.allowGuests, closesAt: s.closesAt, meeting: s.meeting };
}

/** Idempotent: a second scan returns the existing record instead of a duplicate. */
export async function recordMemberAttendance(meetingId: string, memberId: string, sessionId: string | null, method: "QR" | "MANUAL", recordedById?: string, status: "PRESENT" | "EXCUSED" | "MAKEUP" = "PRESENT") {
  const existing = await db.attendanceRecord.findUnique({ where: { meetingId_memberId: { meetingId, memberId } } });
  if (existing) {
    // an apology recorded in advance shouldn't block the member who turns up after all
    if (existing.status === "EXCUSED" && method === "QR") {
      const record = await db.attendanceRecord.update({ where: { id: existing.id }, data: { status: "PRESENT", method: "QR", sessionId, checkedInAt: new Date() } });
      return { record, duplicate: false };
    }
    return { record: existing, duplicate: true };
  }
  try {
    const record = await db.attendanceRecord.create({ data: { meetingId, memberId, sessionId, method, recordedById, status } });
    return { record, duplicate: false };
  } catch {
    const record = await db.attendanceRecord.findUniqueOrThrow({ where: { meetingId_memberId: { meetingId, memberId } } });
    return { record, duplicate: true };
  }
}
