import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { meetingsWithCounts } from "@/lib/attendance-report";
import { getNextFellowship } from "@/lib/queries";
import { PageTitle, Stat } from "@/components/admin/ui";
import { formatDate, formatDateTime, formatTime } from "@/lib/time";

export const metadata = { title: "Dashboard" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const u = await requireAdmin();
  const { denied } = await searchParams;
  const [meetings, fellowship, inbox, pendingEvents, messages, recent] = await Promise.all([
    can(u.role, "attendance") ? meetingsWithCounts(4) : [],
    getNextFellowship(),
    db.discoveredItem.count({ where: { status: "NEW" } }),
    db.event.count({ where: { status: "PENDING_REVIEW" } }),
    db.contactMessage.count({ where: { handled: false } }),
    can(u.role, "audit") ? db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 6 }) : [],
  ]);
  const last = meetings[0];
  const tasks = [
    can(u.role, "inbox") && pendingEvents + inbox > 0 && { href: "/admin/inbox", text: `${pendingEvents + inbox} items found online to review` },
    can(u.role, "messages") && messages > 0 && { href: "/admin/messages", text: `${messages} unanswered contact message${messages === 1 ? "" : "s"}` },
  ].filter(Boolean) as { href: string; text: string }[];

  return (
    <>
      <PageTitle title={`Hello, ${u.name.split(" ")[0]}`} actions={<Link href="/" target="_blank" className="btn btn-line !min-h-0 !py-2">View website ↗</Link>} />
      {denied && <p className="mb-4 bg-soil/10 p-3 text-sm text-soil">Your role doesn&rsquo;t include “{denied}”.</p>}

      <div className="mb-6 bg-royal p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Next fellowship</p>
        <p className="display mt-2 text-2xl">{fellowship.event?.title ?? "Sunday fellowship"}</p>
        <p className="mt-1 text-sm text-white/70">{formatDate(fellowship.startsAt, "day")} · {formatTime(fellowship.startsAt)} · {fellowship.venue}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {fellowship.event ? <Link href={`/admin/content/events/${fellowship.event.id}`} className="btn btn-gold !min-h-0 !py-2.5">Edit this event</Link> : <Link href="/admin/content/events/new" className="btn btn-gold !min-h-0 !py-2.5">Add a programme for this Sunday</Link>}
          {can(u.role, "attendance") && <Link href="/admin/attendance/poster" target="_blank" className="btn btn-ghost !min-h-0 !py-2.5">Attendance QR</Link>}
        </div>
      </div>

      {tasks.length > 0 && (
        <ul className="mb-6 space-y-2">
          {tasks.map((t) => <li key={t.href}><Link href={t.href} className="card flex items-center justify-between p-4 text-sm font-semibold hover:bg-paper-2">{t.text}<span aria-hidden>→</span></Link></li>)}
        </ul>
      )}

      {can(u.role, "attendance") && (
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-royal">Last fellowship{last ? ` · ${formatDate(last.date, "short")}` : ""}</h2>
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Signed in" value={last?.total ?? "—"} /><Stat label="Members" value={last?.members ?? "—"} /><Stat label="Guests" value={last?.guests ?? "—"} /><Stat label="Rotaractors" value={last?.rotaractors ?? "—"} />
          </div>
          <Link href="/admin/attendance" className="mt-3 inline-block text-sm font-semibold underline">All attendance</Link>
        </section>
      )}

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[["/admin/content/events/new", "Add an event"], ["/admin/content/stories/new", "Write a news story"], ["/admin/content/projects/new", "Add a project"], ["/admin/media", "Upload photos"]].map(([h, l]) => (
          <Link key={h} href={h} className="card p-4 text-sm font-semibold hover:bg-paper-2">{l} →</Link>
        ))}
      </section>

      {recent.length > 0 && (
        <section className="card">
          <h2 className="border-b border-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-royal">Recent activity</h2>
          <ul className="divide-y divide-ink/5 text-sm">{recent.map((r) => <li key={r.id} className="flex justify-between gap-3 px-4 py-2"><span><strong>{r.actorName}</strong> {r.action} · {r.summary ?? r.entity}</span><span className="whitespace-nowrap text-xs text-muted">{formatDateTime(r.createdAt)}</span></li>)}</ul>
        </section>
      )}
    </>
  );
}
