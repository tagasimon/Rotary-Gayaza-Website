import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { attendanceAnalytics, rotaryYearsWithMeetings, type AttendanceFilters } from "@/lib/analytics";
import { PageTitle, Stat, Badge } from "@/components/admin/ui";
import { AttendanceOverTime, AttendanceByMeeting, MemberRates, Monthly, ByRotaryYear } from "@/components/admin/Charts";
import { formatDate, fromLocalInput, formatTime } from "@/lib/time";

export const metadata = { title: "Attendance analytics" };

type SP = { from?: string; to?: string; ry?: string; meeting?: string; member?: string; status?: string };

function parseFilters(sp: SP): AttendanceFilters {
  return { from: fromLocalInput(sp.from), to: sp.to ? fromLocalInput(sp.to + "T23:59") : null, ry: sp.ry || undefined, meetingId: sp.meeting || undefined, memberId: sp.member || undefined, status: sp.status || undefined };
}

export default async function AttendancePage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("attendance");
  const sp = await searchParams;
  const f = parseFilters(sp);
  const [a, years, meetingsList, membersList] = await Promise.all([
    attendanceAnalytics(f), rotaryYearsWithMeetings(),
    db.meeting.findMany({ orderBy: { date: "desc" }, take: 200, select: { id: true, title: true, date: true } }),
    db.member.findMany({ orderBy: { fullName: "asc" }, select: { id: true, fullName: true } }),
  ]);
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]).toString();
  const lbl = (d: Date) => formatDate(d, "short").replace(/ \d{4}$/, "");
  const recent = a.perMeeting.slice(-16);

  // Detail records when a member or meeting is selected (supports the status filter, incl. absent)
  let detail: { meeting: string; date: Date; member: string; status: string; time: string }[] = [];
  if (f.memberId || f.meetingId) {
    const ids = a.perMeeting.map((m) => m.id);
    const recs = await db.attendanceRecord.findMany({ where: { meetingId: { in: ids }, ...(f.memberId ? { memberId: f.memberId } : { memberId: { not: null } }) }, include: { meeting: true, member: true } });
    const byKey = new Map(recs.map((r) => [`${r.meetingId}:${r.memberId}`, r]));
    const people = f.memberId ? membersList.filter((m) => m.id === f.memberId) : a.perMember.map((p) => ({ id: p.id, fullName: p.name }));
    for (const mt of a.perMeeting) for (const p of people) {
      const r = byKey.get(`${mt.id}:${p.id}`);
      const status = r ? r.status : "ABSENT";
      if (!r && !f.meetingId && f.memberId && !a.perMember.find((x) => x.id === p.id)) continue;
      detail.push({ meeting: mt.title, date: mt.date, member: p.fullName, status, time: r ? formatTime(r.checkedInAt) : "" });
    }
    if (f.status) detail = detail.filter((d) => d.status === f.status);
  }

  return (
    <>
      <PageTitle title="Attendance analytics" subtitle="Rotary years run 1 July – 30 June. Members count as available from their join date."
        actions={<>
          <a href={`/admin/attendance/export?kind=meetings&${qs}`} className="btn btn-line !min-h-0 !py-2">Meetings CSV</a>
          <a href={`/admin/attendance/export?kind=members&${qs}`} className="btn btn-line !min-h-0 !py-2">Members CSV</a>
          <a href={`/admin/attendance/export?kind=members&excel=1&${qs}`} className="btn btn-line !min-h-0 !py-2">Excel-friendly CSV</a>
        </>} />
      <form method="get" className="card mb-6 grid gap-3 p-4 sm:grid-cols-3 lg:grid-cols-7" aria-label="Filters">
        <label><span className="label">From</span><input type="date" name="from" defaultValue={sp.from} className="field" /></label>
        <label><span className="label">To</span><input type="date" name="to" defaultValue={sp.to} className="field" /></label>
        <label><span className="label">Rotary year</span><select name="ry" defaultValue={sp.ry ?? ""} className="field"><option value="">All</option>{years.map((y) => <option key={y}>{y}</option>)}</select></label>
        <label><span className="label">Meeting</span><select name="meeting" defaultValue={sp.meeting ?? ""} className="field"><option value="">All</option>{meetingsList.map((m) => <option key={m.id} value={m.id}>{formatDate(m.date, "short")} · {m.title}</option>)}</select></label>
        <label><span className="label">Member</span><select name="member" defaultValue={sp.member ?? ""} className="field"><option value="">All</option>{membersList.map((m) => <option key={m.id} value={m.id}>{m.fullName}</option>)}</select></label>
        <label><span className="label">Attendance status</span><select name="status" defaultValue={sp.status ?? ""} className="field"><option value="">All</option><option value="PRESENT">Present</option><option value="MAKEUP">Make-up</option><option value="EXCUSED">Excused</option><option value="ABSENT">Absent</option></select></label>
        <div className="flex items-end gap-2"><button className="btn btn-royal !min-h-0 w-full !py-2">Apply</button>{qs && <Link href="/admin/attendance" className="btn btn-line !min-h-0 !py-2">Reset</Link>}</div>
      </form>

      <div className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Total members" value={a.totals.totalMembers} />
        <Stat label="Active members" value={a.totals.activeMembers} />
        <Stat label="Meetings held" value={a.totals.meetingsHeld} hint="in the selected range" />
        <Stat label="Average attendance" value={`${a.totals.averageAttendance}%`} hint={`${a.totals.averagePresent} members per meeting`} />
        <Stat label="This month" value={a.totals.thisMonth === null ? "—" : `${a.totals.thisMonth}%`} />
        <Stat label={`Rotary year ${a.totals.currentRotaryYear}`} value={a.totals.thisRotaryYear === null ? "—" : `${a.totals.thisRotaryYear}%`} hint={a.totals.thisRotaryYear === null ? "clear filters to see" : undefined} />
      </div>

      {a.perMeeting.length === 0 ? <div className="card p-10 text-center text-sm text-muted">No meetings with attendance in this range yet.</div> : (
        <div className="grid gap-4 lg:grid-cols-2">
          <AttendanceOverTime data={a.perMeeting.map((m) => ({ label: lbl(m.date), pct: m.pct, present: m.present }))} />
          <AttendanceByMeeting data={recent.map((m) => ({ label: lbl(m.date), present: m.present, guests: m.guests, excused: m.excused }))} />
          <Monthly data={a.monthly} />
          <ByRotaryYear data={a.byRotaryYear} />
          <div className="lg:col-span-2"><MemberRates data={a.perMember.slice(0, 40).map((m) => ({ name: m.name, pct: m.pct }))} /></div>
        </div>
      )}

      {detail.length > 0 && (
        <section className="card mt-6 overflow-x-auto">
          <h2 className="border-b border-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-soil">Attendance records</h2>
          <table className="w-full text-sm"><thead className="text-left text-xs uppercase text-muted"><tr><th className="px-4 py-2">Meeting</th><th className="px-4 py-2">Date</th><th className="px-4 py-2">Member</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Time</th></tr></thead>
            <tbody>{detail.slice(0, 500).map((d, i) => <tr key={i} className="border-t border-ink/5"><td className="px-4 py-1.5">{d.meeting}</td><td className="px-4 py-1.5 text-muted">{formatDate(d.date, "short")}</td><td className="px-4 py-1.5">{d.member}</td><td className="px-4 py-1.5">{d.status === "ABSENT" ? <span className="text-xs font-semibold uppercase text-muted">absent</span> : <Badge value={d.status} />}</td><td className="px-4 py-1.5 text-muted">{d.time}</td></tr>)}</tbody>
          </table>
        </section>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="card overflow-x-auto">
          <h2 className="border-b border-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-soil">By meeting</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted"><tr><th className="px-4 py-2">Meeting</th><th className="px-2 py-2">Date</th><th className="px-2 py-2 text-right">Present</th><th className="px-2 py-2 text-right">Guests</th><th className="px-2 py-2 text-right">Excused</th><th className="px-2 py-2 text-right">Absent</th><th className="px-4 py-2 text-right">%</th></tr></thead>
            <tbody>{[...a.perMeeting].reverse().map((m) => (
              <tr key={m.id} className="border-t border-ink/5"><td className="px-4 py-1.5"><Link className="text-royal hover:underline" href={`/admin/meetings/${m.id}`}>{m.title}</Link></td><td className="px-2 py-1.5 text-muted">{formatDate(m.date, "short")}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{m.present}</td><td className="px-2 py-1.5 text-right tabular-nums">{m.guests}</td><td className="px-2 py-1.5 text-right tabular-nums">{m.excused}</td><td className="px-2 py-1.5 text-right tabular-nums">{m.absent}</td><td className="px-4 py-1.5 text-right font-semibold tabular-nums">{m.pct}%</td></tr>))}</tbody>
          </table>
        </section>
        <section className="card overflow-x-auto">
          <h2 className="border-b border-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-soil">By member</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted"><tr><th className="px-4 py-2">Member</th><th className="px-2 py-2 text-right">Attended</th><th className="px-2 py-2 text-right">Available</th><th className="px-2 py-2 text-right">%</th><th className="px-4 py-2">Last attended</th></tr></thead>
            <tbody>{a.perMember.map((m) => (
              <tr key={m.id} className="border-t border-ink/5"><td className="px-4 py-1.5"><Link href={`/admin/attendance?member=${m.id}`} className="hover:underline">{m.name}</Link> <span className="text-xs text-muted">{m.number}</span></td>
                <td className="px-2 py-1.5 text-right tabular-nums">{m.attended}</td><td className="px-2 py-1.5 text-right tabular-nums">{m.available}</td>
                <td className="px-2 py-1.5 text-right font-semibold tabular-nums"><span className={m.pct < 50 ? "text-soil" : ""}>{m.pct}%</span></td><td className="px-4 py-1.5 text-muted">{m.last ? formatDate(m.last, "short") : "—"}</td></tr>))}</tbody>
          </table>
        </section>
      </div>
    </>
  );
}
