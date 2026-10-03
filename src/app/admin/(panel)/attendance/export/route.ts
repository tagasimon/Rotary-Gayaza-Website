import { getAdmin } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { toLocalInput } from "@/lib/time";
import { displayName } from "@/lib/attendance-report";

const esc = (v: unknown) => { const s = v === null || v === undefined ? "" : String(v); return /[",\n\r]/.test(s) || /^[=+\-@]/.test(s) ? `"${s.replace(/^([=+\-@])/, "'$1").replace(/"/g, '""')}"` : s; };

// Excel-friendly CSV (UTF-8 BOM + CRLF) of every sign-in, or one meeting's with ?meeting=<id>
export async function GET(req: Request) {
  const u = await getAdmin();
  if (!u || !can(u.role, "attendance")) return new Response("Forbidden", { status: 403 });
  const meetingId = new URL(req.url).searchParams.get("meeting") || undefined;
  const rows = await db.attendanceRecord.findMany({ where: meetingId ? { meetingId } : {}, include: { meeting: true, member: { select: { fullName: true } } }, orderBy: [{ meeting: { date: "desc" } }, { checkedInAt: "asc" }] });
  const out = [["Date", "Meeting", "Name", "Member or guest", "Rotarian or Rotaractor", "Club", "Email", "Phone", "Signed in at", "How"],
    ...rows.map((r) => [toLocalInput(r.meeting.date, true), r.meeting.title, displayName(r), r.isGuest ? "Guest" : "Member", r.affiliation === "ROTARACTOR" ? "Rotaractor" : r.affiliation === "ROTARIAN" ? "Rotarian" : "", r.clubName ?? r.guestClub ?? "", r.email ?? "", r.phone ?? r.guestPhone ?? "", toLocalInput(r.checkedInAt).replace("T", " "), r.method === "QR" ? "QR form" : "Added by admin"])];
  await audit(u, "export", "Attendance", meetingId ?? null, "Exported attendance CSV");
  return new Response("﻿" + out.map((r) => r.map(esc).join(",")).join("\r\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="rc-gayaza-attendance-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" } });
}
