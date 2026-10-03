"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { normPhone } from "@/lib/attendance";

export async function removeRecord(meetingId: string, recordId: string) {
  const u = await requireAdmin("attendance");
  await db.attendanceRecord.delete({ where: { id: recordId } });
  await audit(u, "remove-attendance", "AttendanceRecord", recordId, "Removed a sign-in", { meetingId });
  revalidatePath(`/admin/attendance/${meetingId}`);
}

export async function addRecord(meetingId: string, _: { error?: string; ok?: boolean }, form: FormData) {
  const u = await requireAdmin("attendance");
  const name = String(form.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Enter a name." };
  const isGuest = form.get("isGuest") === "guest";
  const affiliation = form.get("affiliation") === "ROTARACTOR" ? "ROTARACTOR" : "ROTARIAN";
  await db.attendanceRecord.create({ data: { meetingId, name, isGuest, affiliation, clubName: isGuest ? String(form.get("club") ?? "").trim() || null : "Rotary Club of Gayaza", email: String(form.get("email") ?? "").trim().toLowerCase() || null, phone: normPhone(String(form.get("phone") ?? "")) || null, method: "MANUAL", recordedById: u.id } });
  await audit(u, "manual-attendance", "AttendanceRecord", null, `Added ${name} manually`, { meetingId });
  revalidatePath(`/admin/attendance/${meetingId}`);
  return { ok: true };
}

export async function renameMeeting(meetingId: string, form: FormData) {
  const u = await requireAdmin("attendance");
  const title = String(form.get("title") ?? "").trim();
  if (title) await db.meeting.update({ where: { id: meetingId }, data: { title } });
  await audit(u, "update", "Meeting", meetingId, `Renamed to ${title}`);
  revalidatePath(`/admin/attendance/${meetingId}`);
}

export async function deleteMeeting(meetingId: string) {
  const u = await requireAdmin("attendance");
  await db.meeting.delete({ where: { id: meetingId } });
  await audit(u, "delete", "Meeting", meetingId, "Deleted a fellowship and its sign-ins");
  redirect("/admin/attendance");
}
