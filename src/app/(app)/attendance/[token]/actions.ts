"use server";
import { db } from "@/lib/db";
import { getMember, verifyMemberPin, createMemberSession, clientIp } from "@/lib/auth";
import { resolveAttendanceToken, recordMemberAttendance } from "@/lib/attendance";
import { rateLimit } from "@/lib/rate-limit";
import { formatTime } from "@/lib/time";

export type CheckInState = { ok?: boolean; duplicate?: boolean; name?: string; at?: string; error?: string };

async function openSession(token: string) {
  const st = await resolveAttendanceToken(token);
  if (st.kind !== "open") return { error: st.kind === "closed" || st.kind === "not-open" ? "Attendance is currently closed." : "This attendance code is no longer valid." } as const;
  return { st } as const;
}

/** One-tap confirmation for a member whose phone is already remembered. */
export async function confirmAsMember(token: string): Promise<CheckInState> {
  const o = await openSession(token);
  if ("error" in o) return { error: o.error };
  const member = await getMember();
  if (!member) return { error: "Please sign in with your member number and PIN." };
  const { record, duplicate } = await recordMemberAttendance(o.st.meeting.id, member.id, o.st.sessionId, "QR");
  return { ok: true, duplicate, name: member.fullName, at: formatTime(record.checkedInAt) };
}

/** Member number + PIN. Optionally remembers the phone so next week is one tap. */
export async function checkInWithPin(token: string, _: CheckInState, form: FormData): Promise<CheckInState> {
  const ip = await clientIp();
  if (!rateLimit(`pin:${ip}`, 20, 15 * 60e3).ok) return { error: "Too many attempts from this phone. Please ask an officer to record you." };
  const o = await openSession(token);
  if ("error" in o) return { error: o.error };
  const memberNumber = String(form.get("memberNumber") ?? "").trim();
  const pin = String(form.get("pin") ?? "").trim();
  if (!memberNumber || !/^\d{4,8}$/.test(pin)) return { error: "Enter your member number and your 4–8 digit PIN." };
  if (!rateLimit(`pinmember:${memberNumber.toUpperCase()}`, 10, 15 * 60e3).ok) return { error: "Too many attempts for this member number. Please ask an officer to record you." };
  const v = await verifyMemberPin(memberNumber, pin);
  if (!v.ok) return { error: v.error };
  if (form.get("remember") === "on") await createMemberSession(v.member.id);
  const { record, duplicate } = await recordMemberAttendance(o.st.meeting.id, v.member.id, o.st.sessionId, "QR");
  return { ok: true, duplicate, name: v.member.fullName, at: formatTime(record.checkedInAt) };
}

export async function checkInGuest(token: string, _: CheckInState, form: FormData): Promise<CheckInState> {
  const ip = await clientIp();
  if (!rateLimit(`guest:${ip}`, 6, 60 * 60e3).ok) return { error: "Too many guest check-ins from this phone." };
  const o = await openSession(token);
  if ("error" in o) return { error: o.error };
  if (!o.st.allowGuests) return { error: "Guest check-in is not enabled for this meeting." };
  const guestName = String(form.get("guestName") ?? "").trim().slice(0, 120);
  if (guestName.length < 2) return { error: "Please enter your name." };
  const rec = await db.attendanceRecord.create({
    data: { meetingId: o.st.meeting.id, guestName, guestPhone: String(form.get("guestPhone") ?? "").trim().slice(0, 40) || null, guestClub: String(form.get("guestClub") ?? "").trim().slice(0, 120) || null, sessionId: o.st.sessionId, method: "QR" },
  });
  return { ok: true, name: guestName, at: formatTime(rec.checkedInAt) };
}
