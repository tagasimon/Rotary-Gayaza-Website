import { getAdmin } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { attendanceAnalytics } from "@/lib/analytics";
import { fromLocalInput, toLocalInput } from "@/lib/time";
import { audit } from "@/lib/audit";

const esc = (v: unknown) => { const s = v === null || v === undefined ? "" : String(v); return /[",\n\r]/.test(s) || /^[=+\-@]/.test(s) ? `"${s.replace(/^([=+\-@])/, "'$1").replace(/"/g, '""')}"` : s; };

export async function GET(req: Request) {
  const u = await getAdmin();
  if (!u || !can(u.role, "attendance")) return new Response("Forbidden", { status: 403 });
  const sp = new URL(req.url).searchParams;
  const a = await attendanceAnalytics({ from: fromLocalInput(sp.get("from")), to: sp.get("to") ? fromLocalInput(sp.get("to") + "T23:59") : null, ry: sp.get("ry") || undefined, meetingId: sp.get("meeting") || undefined, memberId: sp.get("member") || undefined });
  const kind = sp.get("kind") === "meetings" ? "meetings" : "members";
  const rows: unknown[][] = kind === "meetings"
    ? [["Meeting", "Date", "Rotary year", "Members present", "Guests", "Excused", "Absent", "Available members", "Attendance %"],
       ...a.perMeeting.map((m) => [m.title, toLocalInput(m.date).replace("T", " "), m.rotaryYear, m.present, m.guests, m.excused, m.absent, m.eligible, m.pct])]
    : [["Member", "Member ID", "Status", "Meetings attended", "Excused", "Meetings available", "Attendance %", "Last attendance"],
       ...a.perMember.map((m) => [m.name, m.number, m.status, m.attended, m.excused, m.available, m.pct, m.last ? toLocalInput(m.last, true) : ""])];
  const excel = sp.get("excel") === "1";
  const body = (excel ? "﻿" : "") + rows.map((r) => r.map(esc).join(",")).join(excel ? "\r\n" : "\n");
  await audit(u, "export", "Attendance", null, `Exported ${kind} CSV`);
  return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="rc-gayaza-attendance-${kind}-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" } });
}
