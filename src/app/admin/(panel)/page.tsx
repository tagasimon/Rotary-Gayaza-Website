import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { attendanceAnalytics } from "@/lib/analytics";
import { currentRotaryYear } from "@/lib/rotary-year";
import { PageTitle, Stat, Badge } from "@/components/admin/ui";
import { AttendanceOverTime } from "@/components/admin/Charts";
import { quickCreateNextMeeting } from "./meetings/actions";
import { formatDate, formatDateTime, formatTime } from "@/lib/time";

export const metadata = { title: "Dashboard" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const u = await requireAdmin();
  const { denied } = await searchParams;
  const ry = currentRotaryYear();
  const now = new Date();
  const showAttendance = can(u.role, "attendance");
  const pending = { verification: { in: ["CLUB_RECORD", "NEEDS_CONFIRMATION"] as ("CLUB_RECORD" | "NEEDS_CONFIRMATION")[] } };
  const [a, inbox, pendingEvents, messages, upcomingMeetings, nextVisit, confirm, recent] = await Promise.all([
    showAttendance ? attendanceAnalytics({ ry }) : null,
    db.discoveredItem.count({ where: { status: "NEW" } }),
    db.event.count({ where: { status: "PENDING_REVIEW" } }),
    db.contactMessage.count({ where: { handled: false } }),
    db.meeting.findMany({ where: { date: { gte: new Date(now.getTime() - 6 * 3600e3) } }, orderBy: { date: "asc" }, take: 4 }),
    db.dGVisit.findFirst({ where: { date: { gte: now } }, orderBy: { date: "asc" } }),
    Promise.all([
      db.project.count({ where: pending }), db.timelineEntry.count({ where: pending }), db.impactMetric.count({ where: pending }),
      db.clubRelationship.count({ where: pending }), db.club.count({ where: pending }), db.story.count({ where: pending }), db.dGVisit.count({ where: pending }), db.president.count({ where: pending }),
    ]),
    can(u.role, "audit") ? db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }) : [],
  ]);
  const confirmRows: [string, number, string][] = [["Projects", confirm[0], "projects"], ["Timeline entries", confirm[1], "timeline"], ["Impact metrics", confirm[2], "metrics"], ["Club relationships", confirm[3], "relationships"], ["Clubs", confirm[4], "clubs"], ["Stories", confirm[5], "stories"], ["DG visits", confirm[6], "dg-visits"], ["Presidents", confirm[7], "presidents"]];
  return (
    <>
      <PageTitle title={`Good ${now.getUTCHours() + 3 < 12 ? "morning" : now.getUTCHours() + 3 < 17 ? "afternoon" : "evening"}, ${u.name.split(" ")[0]}`} subtitle={`Rotary year ${ry}`}
        actions={<>{can(u.role, "meetings") && <form action={quickCreateNextMeeting}><button className="btn btn-gold !min-h-0 !py-2">+ Next Sunday&rsquo;s meeting</button></form>}<Link href="/" target="_blank" className="btn btn-line !min-h-0 !py-2">View site ↗</Link></>} />
      {denied && <p className="mb-4 rounded bg-soil/10 p-3 text-sm text-soil">Your role doesn&rsquo;t include access to “{denied}”.</p>}

      {nextVisit && <Link href={`/admin/content/dg-visits/${nextVisit.id}`} className="mb-6 block rounded-lg bg-royal p-4 text-white hover:bg-royal-deep"><span className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Next DG visit</span><span className="display ml-3 text-xl">DG {nextVisit.governorName} · {formatDate(nextVisit.date, "day")} · {nextVisit.timeLabel ?? formatTime(nextVisit.date)}</span></Link>}

      {a && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Total members" value={a.totals.totalMembers} /><Stat label="Active members" value={a.totals.activeMembers} />
          <Stat label={`Meetings ${ry}`} value={a.totals.meetingsHeld} /><Stat label="Average attendance" value={`${a.totals.averageAttendance}%`} />
          <Stat label="This month" value={a.totals.thisMonth === null ? "—" : `${a.totals.thisMonth}%`} /><Stat label="This Rotary year" value={a.totals.thisRotaryYear === null ? "—" : `${a.totals.thisRotaryYear}%`} />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {a && a.perMeeting.length > 0 && <AttendanceOverTime data={a.perMeeting.map((m) => ({ label: formatDate(m.date, "short").replace(/ \d{4}$/, ""), pct: m.pct, present: m.present }))} />}
          <section className="card">
            <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3"><h2 className="text-xs font-bold uppercase tracking-[0.18em] text-soil">Facts awaiting confirmation</h2><span className="text-xs text-muted">Supplied by the club but not yet backed by a public source</span></div>
            <ul className="grid gap-px bg-ink/5 sm:grid-cols-2">{confirmRows.filter(([, n]) => n > 0).map(([l, n, k]) => <li key={k} className="bg-white"><Link href={`/admin/content/${k}?v=CLUB_RECORD`} className="flex justify-between px-4 py-2.5 text-sm hover:bg-paper"><span>{l}</span><span className="font-semibold text-[#7a5200]">{n}</span></Link></li>)}</ul>
          </section>
          {recent.length > 0 && <section className="card"><h2 className="border-b border-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-soil">Recent activity</h2><ul className="divide-y divide-ink/5 text-sm">{recent.map((r) => <li key={r.id} className="flex justify-between gap-3 px-4 py-2"><span><strong>{r.actorName}</strong> {r.action} · {r.summary ?? r.entity}</span><span className="whitespace-nowrap text-xs text-muted">{formatDateTime(r.createdAt)}</span></li>)}</ul></section>}
        </div>
        <aside className="space-y-4">
          {can(u.role, "inbox") && <Link href="/admin/inbox" className="card block p-4 hover:bg-paper"><p className="text-xs font-bold uppercase tracking-[0.18em] text-soil">Discovered online</p><p className="display mt-1 text-3xl">{pendingEvents + inbox}</p><p className="text-xs text-muted">{pendingEvents} events & {inbox} other items to review</p></Link>}
          {can(u.role, "messages") && <Link href="/admin/messages" className="card block p-4 hover:bg-paper"><p className="text-xs font-bold uppercase tracking-[0.18em] text-soil">Contact messages</p><p className="display mt-1 text-3xl">{messages}</p><p className="text-xs text-muted">unhandled</p></Link>}
          {can(u.role, "meetings") && (
            <section className="card p-4"><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-soil">Upcoming meetings</p>
              <ul className="space-y-2 text-sm">{upcomingMeetings.map((m) => <li key={m.id}><Link href={`/admin/meetings/${m.id}`} className="font-semibold text-royal hover:underline">{m.title}</Link><span className="block text-xs text-muted">{formatDate(m.date, "short")} · {formatTime(m.date)} <Badge value={m.type === "DG_VISIT" ? "DG_VISIT" : undefined} /></span></li>)}
                {upcomingMeetings.length === 0 && <li className="text-muted">None scheduled.</li>}</ul>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
