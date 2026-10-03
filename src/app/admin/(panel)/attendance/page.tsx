import Link from "next/link";
import QRCode from "qrcode";
import { requireAdmin } from "@/lib/auth";
import { meetingsWithCounts } from "@/lib/attendance-report";
import { PageTitle, Stat, Empty } from "@/components/admin/ui";
import { AttendanceByMeeting } from "@/components/admin/Charts";
import { CopyLink } from "@/components/admin/CopyLink";
import { formatDate } from "@/lib/time";
import { SITE_URL } from "@/lib/utils";

export const metadata = { title: "Attendance" };

export default async function Attendance() {
  await requireAdmin("attendance");
  const url = `${SITE_URL()}/attend`;
  const [svg, meetings] = await Promise.all([
    QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#151515", light: "#ffffff" } }),
    meetingsWithCounts(),
  ]);
  const last = meetings[0];
  const recent = meetings.slice(0, 12).reverse();
  const avg = meetings.length ? Math.round(meetings.slice(0, 8).reduce((a, m) => a + m.total, 0) / Math.min(8, meetings.length)) : 0;
  return (
    <>
      <PageTitle title="Attendance" subtitle="One permanent QR code. Members and guests scan it, fill in a short form, and are recorded against that day's fellowship automatically."
        actions={<a href="/admin/attendance/export" className="btn btn-line !min-h-0 !py-2">Download all (CSV)</a>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Last fellowship" value={last ? last.total : "—"} hint={last ? formatDate(last.date, "short") : "No sign-ins yet"} />
            <Stat label="Members" value={last?.members ?? "—"} hint="last fellowship" />
            <Stat label="Guests" value={last?.guests ?? "—"} hint="last fellowship" />
            <Stat label="Average" value={avg || "—"} hint="per fellowship (last 8)" />
          </div>
          {recent.length > 1 && <AttendanceByMeeting data={recent.map((m) => ({ label: formatDate(m.date, "short").replace(/ \d{4}$/, ""), present: m.members, guests: m.guests, excused: 0 }))} />}
          <section className="card overflow-x-auto">
            <h2 className="border-b border-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-royal">Fellowships</h2>
            {meetings.length === 0 ? <div className="p-8"><Empty>No sign-ins yet. Print the QR code and put it up at Sunday&rsquo;s fellowship.</Empty></div> : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted"><tr><th className="px-4 py-2">Date</th><th className="px-2 py-2">Meeting</th><th className="px-2 py-2 text-right">Members</th><th className="px-2 py-2 text-right">Guests</th><th className="px-2 py-2 text-right">Rotarians</th><th className="px-2 py-2 text-right">Rotaractors</th><th className="px-4 py-2 text-right">Total</th></tr></thead>
                <tbody>
                  {meetings.map((m) => (
                    <tr key={m.id} className="border-t border-ink/5 hover:bg-paper-2">
                      <td className="whitespace-nowrap px-4 py-2"><Link href={`/admin/attendance/${m.id}`} className="font-semibold text-royal hover:underline">{formatDate(m.date, "short")}</Link></td>
                      <td className="px-2 py-2">{m.title}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{m.members}</td><td className="px-2 py-2 text-right tabular-nums">{m.guests}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{m.rotarians}</td><td className="px-2 py-2 text-right tabular-nums">{m.rotaractors}</td>
                      <td className="px-4 py-2 text-right font-semibold tabular-nums">{m.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
        <aside className="card h-fit p-5">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-royal">The QR code</h2>
          <p className="mt-1 text-xs text-muted">It never changes, so print it once and reuse it every Sunday.</p>
          <div className="mt-4 border border-ink/10 p-3" dangerouslySetInnerHTML={{ __html: svg }} aria-label="Attendance QR code" role="img" />
          <p className="mt-3 break-all text-xs text-muted">{url}</p>
          <div className="mt-4 grid gap-2">
            <Link href="/admin/attendance/poster" target="_blank" className="btn btn-dark !min-h-0 !py-3">Print poster / show on screen</Link>
            <a href={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`} download="rc-gayaza-attendance-qr.svg" className="btn btn-line !min-h-0 !py-3">Download QR (SVG)</a>
            <CopyLink text={url} />
          </div>
        </aside>
      </div>
    </>
  );
}
