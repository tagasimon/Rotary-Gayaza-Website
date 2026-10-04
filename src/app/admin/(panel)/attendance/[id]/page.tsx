import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { tally, displayName, guestsByClub } from "@/lib/attendance-report";
import { GuestClubs } from "@/components/admin/GuestClubs";
import { PageTitle, Stat } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { AddAttendee } from "@/components/admin/AddAttendee";
import { removeRecord, addRecord, renameMeeting, deleteMeeting, emailRecord, emailAllPending } from "./actions";
import { PendingButton } from "@/components/admin/PendingButton";
import { emailConfigured } from "@/lib/email/resend";
import { formatDate, formatTime } from "@/lib/time";

export default async function MeetingAttendance({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("attendance");
  const { id } = await params;
  const m = await db.meeting.findUnique({ where: { id }, include: { records: { include: { member: { select: { fullName: true } } }, orderBy: { checkedInAt: "asc" } } } });
  if (!m) notFound();
  const t = tally(m.records);
  const mailOn = emailConfigured();
  const pending = m.records.filter((r) => r.email && r.emailStatus !== "SENT").length;
  return (
    <>
      <p className="pt-2 text-sm"><Link href="/admin/attendance" className="text-muted underline">← Attendance</Link></p>
      <PageTitle title={m.title} subtitle={formatDate(m.date, "day")} actions={<a href={`/admin/attendance/export?meeting=${m.id}`} className="btn btn-line !min-h-0 !py-2">Download CSV</a>} />
      <div className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6"><Stat label="Total" value={t.total} /><Stat label="Members" value={t.members} /><Stat label="Guests" value={t.guests} /><Stat label="Rotarians" value={t.rotarians} /><Stat label="Rotaractors" value={t.rotaractors} /><Stat label="Prospects" value={t.prospects} /></div>
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted"><tr><th className="px-4 py-2">Name</th><th className="px-2 py-2">Type</th><th className="px-2 py-2">Club</th><th className="px-2 py-2">Email</th><th className="px-2 py-2">Phone</th><th className="px-2 py-2">Time</th><th className="px-2 py-2">Thank-you email</th><th className="px-4 py-2" /></tr></thead>
            <tbody>
              {m.records.map((r) => (
                <tr key={r.id} className="border-t border-ink/5 align-top">
                  <td className="px-4 py-2 font-semibold">{displayName(r)}</td>
                  <td className="px-2 py-2 text-xs"><span className={r.isGuest ? "text-soil" : "text-leaf"}>{r.isGuest ? (r.affiliation === "PROSPECT" ? "Prospect" : "Visiting") : "Member"}</span>{r.affiliation && r.affiliation !== "PROSPECT" && <span className="block text-muted">{r.affiliation === "ROTARACTOR" ? "Rotaractor" : "Rotarian"}</span>}</td>
                  <td className="px-2 py-2 text-xs">{r.clubName ?? r.guestClub ?? "—"}</td>
                  <td className="px-2 py-2 text-xs">{r.email ?? "—"}</td>
                  <td className="whitespace-nowrap px-2 py-2 text-xs">{r.phone ?? r.guestPhone ?? "—"}</td>
                  <td className="whitespace-nowrap px-2 py-2 text-xs text-muted">{formatTime(r.checkedInAt)}{r.method === "MANUAL" ? " · added" : ""}</td>
                  <td className="min-w-[150px] whitespace-nowrap px-2 py-2 text-xs">
                    {!r.email ? <span className="text-muted">No email</span> : (
                      <div className="space-y-1">
                        <span title={r.emailError ?? undefined} className={`inline-block rounded-full px-2 py-0.5 font-bold ${r.emailStatus === "SENT" ? "bg-leaf/10 text-leaf" : r.emailStatus === "FAILED" ? "bg-cranberry/10 text-cranberry" : "bg-paper-2 text-muted"}`}>
                          {r.emailStatus === "SENT" ? `Sent ${r.emailSentAt ? formatTime(r.emailSentAt) : ""}` : r.emailStatus === "FAILED" ? "Failed" : r.emailStatus === "SKIPPED" ? "Not sent" : "Pending"}
                        </span>
                        {r.emailStatus === "FAILED" && r.emailError && <span className="block max-w-[180px] text-[0.7rem] text-cranberry">{r.emailError}</span>}
                        {mailOn && <form action={emailRecord.bind(null, m.id, r.id)}><PendingButton className="font-semibold text-royal underline">{r.emailStatus === "SENT" ? "Send again" : "Send now"}</PendingButton></form>}
                      </div>
                    )}
                    {r.email && <a href={`/admin/attendance/email-preview/${r.id}`} target="_blank" className="mt-1 block font-semibold text-royal underline">Preview email</a>}
                    {r.isGuest && r.affiliation !== "PROSPECT" && <a href={`/admin/attendance/card/${r.id}`} target="_blank" className="mt-1 block font-semibold text-azure underline">Make-up card (PDF)</a>}
                  </td>
                  <td className="px-4 py-2 text-right"><ConfirmButton action={removeRecord.bind(null, m.id, r.id)} label="Remove" confirmText="Sure?" /></td>
                </tr>
              ))}
              {m.records.length === 0 && <tr><td className="px-4 py-8 text-center text-muted" colSpan={8}>No one has signed in yet.</td></tr>}
            </tbody>
          </table>
        </section>
        <aside className="space-y-4">
          <GuestClubs rows={guestsByClub(m.records)} title="Visiting clubs" showLast={false} />
          <div className="card space-y-2 p-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-royal">Thank-you emails</h2>
            {mailOn ? <>
              <p className="text-xs text-muted">Sent automatically after each sign-in. Visiting Rotarians and Rotaractors also get a PDF make-up card.</p>
              {pending > 0 && <form action={emailAllPending.bind(null, m.id)}><PendingButton className="btn btn-royal !min-h-0 !py-2 text-xs">Send {pending} pending</PendingButton></form>}
            </> : <p className="text-xs text-muted">Off. Set <code>RESEND_API_KEY</code> (and <code>EMAIL_FROM</code>) in Coolify to turn them on.</p>}
          </div>
          <div className="card p-4"><h2 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-royal">Add someone</h2><AddAttendee action={addRecord.bind(null, m.id)} /></div>
          <form action={renameMeeting.bind(null, m.id)} className="card space-y-2 p-4"><h2 className="text-xs font-bold uppercase tracking-[0.18em] text-royal">Meeting name</h2><input name="title" defaultValue={m.title} className="field" /><button className="btn btn-line !min-h-0 !py-2">Save</button></form>
          <div className="card p-4"><ConfirmButton action={deleteMeeting.bind(null, m.id)} label="Delete this fellowship and all its sign-ins" confirmText="Click again to delete" /></div>
        </aside>
      </div>
    </>
  );
}
