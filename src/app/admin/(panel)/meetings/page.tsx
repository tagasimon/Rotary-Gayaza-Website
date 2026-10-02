import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PageTitle, Badge, Empty } from "@/components/admin/ui";
import { MeetingForm } from "@/components/admin/MeetingForms";
import { saveMeeting, quickCreateNextMeeting } from "./actions";
import { formatDate, formatTime } from "@/lib/time";

export const metadata = { title: "Meetings" };

export default async function Meetings() {
  await requireAdmin("meetings");
  const now = new Date();
  const [upcoming, past, events, activeCount] = await Promise.all([
    db.meeting.findMany({ where: { date: { gte: new Date(now.getTime() - 6 * 3600e3) } }, orderBy: { date: "asc" }, take: 10, include: { _count: { select: { records: true } }, sessions: { where: { revokedAt: null, closesAt: { gte: now } } } } }),
    db.meeting.findMany({ where: { date: { lt: new Date(now.getTime() - 6 * 3600e3) } }, orderBy: { date: "desc" }, take: 30, include: { records: { select: { memberId: true, status: true } } } }),
    db.event.findMany({ where: { status: "APPROVED", scope: "CLUB" }, orderBy: { startsAt: "desc" }, take: 30, select: { id: true, title: true } }),
    db.member.count({ where: { status: "ACTIVE" } }),
  ]);
  return (
    <>
      <PageTitle title="Meetings & QR attendance" subtitle="Create a meeting, open attendance, show the QR code on the projector."
        actions={<form action={quickCreateNextMeeting}><button className="btn btn-gold !min-h-0 !py-2">+ Next Sunday&rsquo;s fellowship</button></form>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-soil">Upcoming & today</h2>
            {upcoming.length === 0 ? <Empty>No upcoming meetings. Use “Next Sunday’s fellowship” to create one in a click.</Empty> : (
              <ul className="card divide-y divide-ink/5">
                {upcoming.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div><Link href={`/admin/meetings/${m.id}`} className="font-semibold text-royal hover:underline">{m.title}</Link><p className="text-sm text-muted">{formatDate(m.date, "day")} · {formatTime(m.date)} · {m.rotaryYear}</p></div>
                    <div className="flex items-center gap-2">{m.sessions.length > 0 && <Badge value="APPROVED" />}<span className="text-sm text-muted">{m._count.records} checked in</span><Link href={`/admin/meetings/${m.id}`} className="btn btn-line !min-h-0 !py-1.5 text-xs">Open</Link></div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-soil">Past meetings</h2>
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-muted"><tr><th className="px-3 py-2">Meeting</th><th className="px-3 py-2">Date</th><th className="px-3 py-2 text-right">Members present</th><th className="px-3 py-2 text-right">Guests</th></tr></thead>
                <tbody>{past.map((m) => (
                  <tr key={m.id} className="border-b border-ink/5 last:border-0">
                    <td className="px-3 py-2"><Link href={`/admin/meetings/${m.id}`} className="text-royal hover:underline">{m.title}</Link>{!m.countsTowardAttendance && <span className="ml-2 text-xs text-muted">(not counted)</span>}</td>
                    <td className="px-3 py-2 text-muted">{formatDate(m.date, "short")}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{m.records.filter((r) => r.memberId && r.status !== "EXCUSED").length}{activeCount ? <span className="text-muted"> / {activeCount}</span> : null}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{m.records.filter((r) => !r.memberId).length + m.guestCount}</td>
                  </tr>))}</tbody>
              </table>
            </div>
          </section>
        </div>
        <aside className="card h-fit p-5">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-soil">New meeting</h2>
          <MeetingForm action={saveMeeting.bind(null, null)} v={{ countsTowardAttendance: true, type: "REGULAR" }} events={events} />
        </aside>
      </div>
    </>
  );
}
