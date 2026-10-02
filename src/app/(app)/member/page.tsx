import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { db } from "@/lib/db";
import { currentRotaryYear, rotaryYearRange } from "@/lib/rotary-year";
import { formatDate, formatTime } from "@/lib/time";

export const metadata: Metadata = { title: "My Rotary", robots: { index: false } };

export default async function MemberHome() {
  const m = await requireMember();
  const ry = currentRotaryYear();
  const { start } = rotaryYearRange(ry);
  const now = new Date();
  const eligibleFrom = m.joinDate && m.joinDate > start ? m.joinDate : start;
  const [meetings, mine, events, announcements, recent] = await Promise.all([
    db.meeting.count({ where: { rotaryYear: ry, countsTowardAttendance: true, date: { gte: eligibleFrom, lte: now } } }),
    db.attendanceRecord.count({ where: { memberId: m.id, status: { in: ["PRESENT", "MAKEUP"] }, meeting: { rotaryYear: ry, countsTowardAttendance: true, date: { lte: now } } } }),
    db.event.findMany({ where: { status: "APPROVED", startsAt: { gte: now } }, orderBy: { startsAt: "asc" }, take: 5 }),
    db.announcement.findMany({ where: { status: "PUBLISHED", OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }, orderBy: [{ pinned: "desc" }, { createdAt: "desc" }], take: 5 }),
    db.attendanceRecord.findMany({ where: { memberId: m.id }, include: { meeting: true }, orderBy: { meeting: { date: "desc" } }, take: 8 }),
  ]);
  const pct = meetings ? Math.round((Math.min(mine, meetings) / meetings) * 100) : 0;
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div><p className="eyebrow text-soil">My Rotary · {ry}</p><h1 className="display mt-1 text-4xl">Hello, {m.fullName.split(" ")[0]}.</h1><p className="text-sm text-muted">{m.memberNumber}{m.rotaryRole ? ` · ${m.rotaryRole}` : ""}</p></div>
        <a href="/member/logout" className="text-sm text-muted underline">Sign out</a>
      </div>

      <section className="grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-line ring-1 ring-ink/5" aria-label="My attendance">
        <div className="col-span-3 bg-royal p-5 text-white">
          <p className="eyebrow text-gold">My attendance this Rotary year</p>
          <p className="display mt-1 text-6xl">{pct}%</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-gold" style={{ width: `${pct}%` }} /></div>
        </div>
        <div className="bg-white p-4"><p className="display text-3xl">{mine}</p><p className="text-xs text-muted">meetings attended</p></div>
        <div className="bg-white p-4"><p className="display text-3xl">{meetings}</p><p className="text-xs text-muted">meetings held</p></div>
        <div className="bg-white p-4"><Link href="/scan" className="flex h-full flex-col justify-between"><span className="display text-3xl text-royal">⌗</span><span className="text-xs font-semibold text-royal">Scan to check in</span></Link></div>
      </section>

      {announcements.length > 0 && (
        <section><h2 className="eyebrow mb-2 text-soil">Club announcements</h2>
          <ul className="space-y-2">{announcements.map((a) => <li key={a.id} className={`rounded-lg bg-white p-4 ring-1 ring-ink/5 ${a.pinned ? "border-l-4 border-gold" : ""}`}><p className="font-semibold">{a.title}</p>{a.body && <p className="mt-1 text-sm text-ink-2">{a.body}</p>}</li>)}</ul>
        </section>
      )}

      <section><h2 className="eyebrow mb-2 text-soil">Upcoming</h2>
        <ul className="divide-y divide-line rounded-lg bg-white ring-1 ring-ink/5">
          {events.map((e) => <li key={e.id} className="p-4"><Link href={`/events/${e.slug}`} className="font-semibold hover:text-royal">{e.title}</Link><p className="text-sm text-muted">{formatDate(e.startsAt, "short")} · {formatTime(e.startsAt)}{e.venue ? ` · ${e.venue}` : ""}</p></li>)}
          {events.length === 0 && <li className="p-4 text-sm text-muted">No upcoming events listed.</li>}
        </ul>
      </section>

      <section><h2 className="eyebrow mb-2 text-soil">Recent check-ins</h2>
        <ul className="divide-y divide-line rounded-lg bg-white ring-1 ring-ink/5">
          {recent.map((r) => <li key={r.id} className="flex items-center justify-between p-4 text-sm"><span><span className="font-semibold">{r.meeting.title}</span><span className="block text-muted">{formatDate(r.meeting.date, "short")}</span></span><span className={`chip ${r.status === "EXCUSED" ? "" : "border-leaf text-leaf"}`}>{r.status.toLowerCase()}</span></li>)}
          {recent.length === 0 && <li className="p-4 text-sm text-muted">No attendance recorded yet.</li>}
        </ul>
      </section>

      <section className="rounded-lg bg-white p-4 text-sm ring-1 ring-ink/5"><h2 className="eyebrow mb-2 text-soil">My profile</h2>
        <dl className="grid grid-cols-[110px_1fr] gap-y-1"><dt className="text-muted">Name</dt><dd>{m.fullName}</dd><dt className="text-muted">Member no.</dt><dd>{m.memberNumber}</dd><dt className="text-muted">Email</dt><dd>{m.email ?? "—"}</dd><dt className="text-muted">Phone</dt><dd>{m.phone ?? "—"}</dd><dt className="text-muted">Joined</dt><dd>{m.joinDate ? formatDate(m.joinDate) : "—"}</dd></dl>
        <p className="mt-3 text-xs text-muted">To correct your details, speak to the club secretary.</p>
        <Link href="/member/pin" className="mt-3 inline-block font-semibold text-royal underline">Change my PIN</Link>
      </section>
    </div>
  );
}
