import type { Metadata } from "next";
import { resolveAttendanceToken } from "@/lib/attendance";
import { getMember } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatTime } from "@/lib/time";
import { CheckIn } from "./CheckIn";

export const metadata: Metadata = { title: "Attendance", robots: { index: false, follow: false } };

export default async function AttendancePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [st, member] = await Promise.all([resolveAttendanceToken(token), getMember()]);
  const now = new Date();

  const Shell = ({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "warn" }) => (
    <div className="space-y-6">
      {"meeting" in st && st.meeting && (
        <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-ink/5">
          <p className="eyebrow text-soil">Attendance · {formatDate(now, "day")}</p>
          <h1 className="display mt-2 text-3xl leading-tight">{st.meeting.title}</h1>
          <p className="mt-1 text-ink-2">{formatDate(st.meeting.date, "short")} · {formatTime(st.meeting.date)}{st.meeting.venue ? ` · ${st.meeting.venue}` : ""}</p>
          <p className="mt-3 text-sm tabular-nums text-muted">Now {formatTime(now)}</p>
        </div>
      )}
      <div className={tone === "warn" ? "rounded-lg border-l-4 border-gold bg-white p-5" : ""}>{children}</div>
    </div>
  );

  if (st.kind === "invalid") return <Shell tone="warn"><h1 className="display text-3xl">This code isn&rsquo;t valid.</h1><p className="mt-2 text-ink-2">Please scan the QR code displayed at today&rsquo;s meeting, or ask an officer to record you.</p></Shell>;
  if (st.kind === "revoked") return <Shell tone="warn"><p className="display text-2xl">This attendance code has been withdrawn.</p><p className="mt-2 text-ink-2">Scan the latest code on screen, or ask an officer.</p></Shell>;
  if (st.kind === "not-open") return <Shell tone="warn"><p className="display text-2xl">Attendance is currently closed.</p><p className="mt-2 text-ink-2">It opens at {formatTime(st.opensAt)}.</p></Shell>;
  if (st.kind === "closed") return <Shell tone="warn"><p className="display text-2xl">Attendance is currently closed.</p><p className="mt-2 text-ink-2">If you were at the meeting, an officer can still record you manually.</p></Shell>;

  const existing = member ? await db.attendanceRecord.findUnique({ where: { meetingId_memberId: { meetingId: st.meeting.id, memberId: member.id } } }) : null;
  return (
    <Shell>
      <CheckIn token={token} memberName={member?.fullName} alreadyAt={existing ? formatTime(existing.checkedInAt) : undefined} allowGuests={st.allowGuests} />
      <p className="mt-6 text-center text-xs text-muted">Open until {formatTime(st.closesAt)}</p>
    </Shell>
  );
}
