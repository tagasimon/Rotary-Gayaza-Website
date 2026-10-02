import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageTitle, Badge, Stat } from "@/components/admin/ui";
import { MeetingForm, OpenAttendanceForm, ManualRecordForm, GuestForm } from "@/components/admin/MeetingForms";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { saveMeeting, openAttendance, revokeAttendance, manualRecord, addGuest, removeRecord, deleteMeeting } from "../actions";
import { formatDate, formatTime, toLocalInput } from "@/lib/time";
import { SITE_URL } from "@/lib/utils";

export default async function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await requireAdmin("meetings");
  const m = await db.meeting.findUnique({ where: { id }, include: { records: { include: { member: true }, orderBy: { checkedInAt: "asc" } }, sessions: { orderBy: { createdAt: "desc" } } } });
  if (!m) notFound();
  const now = new Date();
  const live = m.sessions.find((s) => !s.revokedAt && s.closesAt > now);
  const url = live ? `${SITE_URL()}/attendance/${live.token}` : null;
  const svg = url ? await QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 1, color: { dark: "#0f1b2d", light: "#ffffff" } }) : null;
  const [members, events] = await Promise.all([
    db.member.findMany({ where: { status: { in: ["ACTIVE", "HONORARY"] } }, orderBy: { fullName: "asc" }, select: { id: true, fullName: true, memberNumber: true, joinDate: true } }),
    db.event.findMany({ where: { status: "APPROVED", scope: "CLUB" }, orderBy: { startsAt: "desc" }, take: 30, select: { id: true, title: true } }),
  ]);
  const recorded = new Set(m.records.map((r) => r.memberId).filter(Boolean));
  const memberRecs = m.records.filter((r) => r.memberId);
  const guests = m.records.filter((r) => !r.memberId);
  const present = memberRecs.filter((r) => r.status !== "EXCUSED").length;
  const excused = memberRecs.filter((r) => r.status === "EXCUSED").length;
  const eligible = new Set([...members.filter((x) => !x.joinDate || x.joinDate <= m.date).map((x) => x.id), ...recorded]).size;
  const canAttend = can(u.role, "attendance");

  return (
    <>
      <p className="pt-2 text-sm"><Link href="/admin/meetings" className="text-muted underline">← Meetings</Link></p>
      <PageTitle title={m.title} subtitle={`${formatDate(m.date, "day")} · ${formatTime(m.date)}${m.venue ? ` · ${m.venue}` : ""} · Rotary year ${m.rotaryYear}`}
        actions={live ? <Link href={`/admin/meetings/${m.id}/present`} target="_blank" className="btn btn-gold !min-h-0 !py-2">Show QR on projector ↗</Link> : undefined} />
      <div className="mb-6 grid gap-3 sm:grid-cols-5">
        <Stat label="Present" value={present} /><Stat label="Excused" value={excused} /><Stat label="Absent" value={Math.max(0, eligible - present - excused)} />
        <Stat label="Guests" value={guests.length + m.guestCount} /><Stat label="Attendance" value={`${eligible ? Math.round((present / eligible) * 100) : 0}%`} hint={`of ${eligible} members`} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          {canAttend && (
            <section className="card p-5">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-soil">QR attendance</h2>
              {live && svg ? (
                <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
                  <div className="rounded bg-white p-2 ring-1 ring-ink/10" dangerouslySetInnerHTML={{ __html: svg }} />
                  <div className="space-y-2 text-sm">
                    <p><Badge value={live.opensAt > now ? "PENDING_REVIEW" : "APPROVED"} /> {live.opensAt > now ? "Scheduled" : "Open"} · {formatTime(live.opensAt)} → {formatTime(live.closesAt)} {live.allowGuests ? "· guests allowed" : ""}</p>
                    <p className="break-all text-xs text-muted">{url}</p>
                    <p className="text-xs text-muted">The code is unique to this meeting, unguessable, and stops working when the window closes or you revoke it. Each member can only be recorded once.</p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Link href={`/admin/meetings/${m.id}/present`} target="_blank" className="btn btn-royal !min-h-0 !py-2">Full-screen for projector</Link>
                      <Link href={`/admin/meetings/${m.id}/present?print=1`} target="_blank" className="btn btn-line !min-h-0 !py-2">Printable sheet</Link>
                    </div>
                    <div className="pt-2"><ConfirmButton action={revokeAttendance.bind(null, m.id, live.id)} label="Revoke this code" confirmText="Click again to revoke" /></div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mb-3 text-sm text-muted">No live attendance code. Choose the window during which members may check in.</p>
                  <OpenAttendanceForm action={openAttendance.bind(null, m.id)} opensAt={toLocalInput(new Date(Math.max(m.date.getTime() - 30 * 60e3, now.getTime() - 60e3)))} closesAt={toLocalInput(new Date((m.endsAt ?? m.date).getTime() + 60 * 60e3))} />
                </>
              )}
            </section>
          )}
          <section className="card">
            <h2 className="border-b border-ink/10 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-soil">Checked in ({m.records.length})</h2>
            <table className="w-full text-sm">
              <tbody>
                {m.records.map((r) => (
                  <tr key={r.id} className="border-b border-ink/5 last:border-0">
                    <td className="px-5 py-2">{r.member ? <><span className="font-semibold">{r.member.fullName}</span> <span className="text-xs text-muted">{r.member.memberNumber}</span></> : <><span className="font-semibold">{r.guestName}</span> <span className="text-xs text-muted">Guest{r.guestClub ? ` · ${r.guestClub}` : ""}</span></>}{r.note && <span className="block text-xs text-muted">{r.note}</span>}</td>
                    <td className="px-2 py-2"><Badge value={r.status} /></td>
                    <td className="px-2 py-2 text-xs text-muted">{r.method === "QR" ? "QR" : "Manual"} · {formatTime(r.checkedInAt)}</td>
                    <td className="px-5 py-2 text-right">{canAttend && <ConfirmButton action={removeRecord.bind(null, m.id, r.id)} label="Remove" confirmText="Confirm" />}</td>
                  </tr>
                ))}
                {m.records.length === 0 && <tr><td className="px-5 py-6 text-center text-muted">No one has checked in yet.</td></tr>}
              </tbody>
            </table>
          </section>
        </div>
        <aside className="space-y-6">
          {canAttend && (
            <section className="card p-5">
              <h2 className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-soil">Record manually</h2>
              <p className="mb-3 text-xs text-muted">For exceptional cases — no phone, forgotten PIN, or apologies sent in advance.</p>
              <ManualRecordForm action={manualRecord.bind(null, m.id)} members={members.filter((x) => !recorded.has(x.id)).map((x) => ({ id: x.id, label: `${x.fullName} (${x.memberNumber})` }))} />
              <h3 className="mb-2 mt-5 text-xs font-bold uppercase tracking-[0.18em] text-soil">Add a guest</h3>
              <GuestForm action={addGuest.bind(null, m.id)} />
            </section>
          )}
          <section className="card p-5">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-soil">Meeting details</h2>
            <MeetingForm action={saveMeeting.bind(null, m.id)} events={events} v={{ title: m.title, date: toLocalInput(m.date), endsAt: toLocalInput(m.endsAt), type: m.type, venue: m.venue ?? "", guestCount: m.guestCount, eventId: m.eventId ?? "", countsTowardAttendance: m.countsTowardAttendance, notes: m.notes ?? "" }} />
            <div className="mt-4 border-t border-ink/10 pt-3"><ConfirmButton action={deleteMeeting.bind(null, m.id)} label="Delete meeting and its attendance" confirmText="Click again to delete permanently" /></div>
          </section>
        </aside>
      </div>
    </>
  );
}
