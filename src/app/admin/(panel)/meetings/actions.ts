"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, randomToken } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { fromLocalInput, localParts } from "@/lib/time";
import { rotaryYearOf } from "@/lib/rotary-year";
import { recordMemberAttendance } from "@/lib/attendance";
import type { MeetingType, AttendanceStatus } from "@prisma/client";

export type S = { error?: string; ok?: boolean };

export async function saveMeeting(id: string | null, _: S, form: FormData): Promise<S> {
  const u = await requireAdmin("meetings");
  const title = String(form.get("title") ?? "").trim();
  const date = fromLocalInput(String(form.get("date") ?? ""));
  if (!title || !date) return { error: "Title and date are required." };
  const data = {
    title, date, endsAt: fromLocalInput(String(form.get("endsAt") ?? "")), rotaryYear: rotaryYearOf(date),
    type: (["REGULAR", "FELLOWSHIP", "SERVICE", "DG_VISIT", "BOARD", "SPECIAL"].includes(String(form.get("type"))) ? String(form.get("type")) : "REGULAR") as MeetingType, venue: String(form.get("venue") ?? "").trim() || null,
    notes: String(form.get("notes") ?? "").trim() || null, guestCount: Math.max(0, parseInt(String(form.get("guestCount") ?? "0"), 10) || 0),
    countsTowardAttendance: form.get("countsTowardAttendance") === "on", eventId: String(form.get("eventId") ?? "") || null,
  };
  const m = id ? await db.meeting.update({ where: { id }, data }) : await db.meeting.create({ data: { ...data, createdById: u.id } });
  await audit(u, id ? "update" : "create", "Meeting", m.id, `${title} (${m.rotaryYear})`);
  revalidatePath("/admin/meetings");
  if (!id) redirect(`/admin/meetings/${m.id}`);
  return { ok: true };
}

export async function quickCreateNextMeeting() {
  const u = await requireAdmin("meetings");
  const club = await db.club.findFirst({ where: { isHome: true } });
  const now = new Date();
  const p = localParts(now);
  const dow = new Date(`${p.ymd}T12:00:00+03:00`).getUTCDay(); // 0 = Sunday
  const add = (7 - dow) % 7;
  const d = new Date(new Date(`${p.ymd}T17:00:00+03:00`).getTime() + add * 864e5);
  const date = d < now ? new Date(d.getTime() + 7 * 864e5) : d;
  const exists = await db.meeting.findFirst({ where: { date } });
  if (exists) redirect(`/admin/meetings/${exists.id}`);
  const m = await db.meeting.create({ data: { title: "Weekly fellowship", type: "REGULAR", date, endsAt: new Date(date.getTime() + 3600e3), rotaryYear: rotaryYearOf(date), venue: club?.venue ?? null, createdById: u.id } });
  await audit(u, "create", "Meeting", m.id, "Weekly fellowship (quick create)");
  redirect(`/admin/meetings/${m.id}`);
}

export async function openAttendance(meetingId: string, _: S, form: FormData): Promise<S> {
  const u = await requireAdmin("attendance");
  const opensAt = fromLocalInput(String(form.get("opensAt") ?? ""));
  const closesAt = fromLocalInput(String(form.get("closesAt") ?? ""));
  if (!opensAt || !closesAt || closesAt <= opensAt) return { error: "Choose a valid attendance window." };
  if (closesAt.getTime() - opensAt.getTime() > 24 * 3600e3) return { error: "The window can be at most 24 hours." };
  if (!(await db.meeting.findUnique({ where: { id: meetingId }, select: { id: true } }))) return { error: "Meeting not found." };
  // one live code per meeting: revoke earlier ones
  await db.attendanceSession.updateMany({ where: { meetingId, revokedAt: null }, data: { revokedAt: new Date() } });
  const s = await db.attendanceSession.create({ data: { meetingId, token: randomToken(32), opensAt, closesAt, allowGuests: form.get("allowGuests") === "on", createdById: u.id } });
  await audit(u, "open-attendance", "AttendanceSession", s.id, `Opened attendance ${opensAt.toISOString()} → ${closesAt.toISOString()}`, { meetingId });
  revalidatePath(`/admin/meetings/${meetingId}`);
  return { ok: true };
}

export async function revokeAttendance(meetingId: string, sessionId: string) {
  const u = await requireAdmin("attendance");
  await db.attendanceSession.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
  await audit(u, "revoke-attendance", "AttendanceSession", sessionId, "Revoked attendance code", { meetingId });
  revalidatePath(`/admin/meetings/${meetingId}`);
}

export async function manualRecord(meetingId: string, _: S, form: FormData): Promise<S> {
  const u = await requireAdmin("attendance");
  const memberId = String(form.get("memberId") ?? "");
  const rawStatus = String(form.get("status") ?? "PRESENT");
  const status = (["PRESENT", "EXCUSED", "MAKEUP"].includes(rawStatus) ? rawStatus : "PRESENT") as AttendanceStatus;
  if (!memberId) return { error: "Choose a member." };
  const { record, duplicate } = await recordMemberAttendance(meetingId, memberId, null, "MANUAL", u.id, status);
  const note = String(form.get("note") ?? "").trim();
  if (duplicate || note) await db.attendanceRecord.update({ where: { id: record.id }, data: { status, note: note || record.note, recordedById: u.id } });
  await audit(u, "manual-attendance", "AttendanceRecord", record.id, `Recorded ${status.toLowerCase()} manually`, { meetingId, memberId, note });
  revalidatePath(`/admin/meetings/${meetingId}`);
  return { ok: true };
}

export async function addGuest(meetingId: string, _: S, form: FormData): Promise<S> {
  const u = await requireAdmin("attendance");
  const guestName = String(form.get("guestName") ?? "").trim();
  if (guestName.length < 2) return { error: "Enter the guest's name." };
  await db.attendanceRecord.create({ data: { meetingId, guestName, guestClub: String(form.get("guestClub") ?? "").trim() || null, method: "MANUAL", recordedById: u.id } });
  revalidatePath(`/admin/meetings/${meetingId}`);
  return { ok: true };
}

export async function removeRecord(meetingId: string, recordId: string) {
  const u = await requireAdmin("attendance");
  await db.attendanceRecord.delete({ where: { id: recordId } });
  await audit(u, "remove-attendance", "AttendanceRecord", recordId, "Removed attendance record", { meetingId });
  revalidatePath(`/admin/meetings/${meetingId}`);
}

export async function deleteMeeting(id: string) {
  const u = await requireAdmin("meetings");
  const m = await db.meeting.delete({ where: { id } });
  await audit(u, "delete", "Meeting", id, `Deleted meeting ${m.title}`);
  redirect("/admin/meetings");
}
