import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatTime } from "@/lib/time";
import { SITE_URL } from "@/lib/utils";
import { LiveCount } from "./LiveCount";

export const metadata = { title: "Attendance QR" };

export default async function Present({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ print?: string }> }) {
  await requireAdmin("attendance");
  const { id } = await params;
  const print = (await searchParams).print === "1";
  const now = new Date();
  const m = await db.meeting.findUnique({ where: { id }, include: { sessions: { where: { revokedAt: null, closesAt: { gt: now } }, orderBy: { createdAt: "desc" }, take: 1 } } });
  if (!m) notFound();
  const s = m.sessions[0];
  if (!s) return <div className="grid min-h-svh place-items-center bg-royal text-center text-white"><div><p className="display text-5xl">Attendance is currently closed.</p><p className="mt-3 text-white/70">Open attendance from the meeting page to show a code.</p></div></div>;
  const url = `${SITE_URL()}/attendance/${s.token}`;
  const svg = await QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 2, color: { dark: "#0f1b2d", light: "#ffffff" } });
  return (
    <div className={`fixed inset-0 z-50 grid ${print ? "bg-white text-ink" : "bg-royal text-white"} lg:grid-cols-2`}>
      <div className="flex flex-col justify-center p-10 lg:p-16">
        <p className={`text-sm font-semibold uppercase tracking-[0.3em] ${print ? "text-soil" : "text-gold"}`}>Rotary Club of Gayaza</p>
        <h1 className="display mt-4 text-5xl leading-tight lg:text-7xl">{m.title}</h1>
        <p className="mt-4 text-2xl opacity-80">{formatDate(m.date, "day")} · {formatTime(m.date)}</p>
        <ol className="mt-10 space-y-3 text-2xl">
          <li><span className={print ? "text-soil" : "text-gold"}>1.</span> Open your phone camera</li>
          <li><span className={print ? "text-soil" : "text-gold"}>2.</span> Scan the code</li>
          <li><span className={print ? "text-soil" : "text-gold"}>3.</span> Tap “I&rsquo;m here”</li>
        </ol>
        {!print && <LiveCount meetingId={m.id} />}
        <p className="mt-6 text-base opacity-60">Open until {formatTime(s.closesAt)}</p>
      </div>
      <div className="flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-[min(80vh,640px)]" dangerouslySetInnerHTML={{ __html: svg }} aria-label="Attendance QR code" role="img" />
      </div>
    </div>
  );
}
