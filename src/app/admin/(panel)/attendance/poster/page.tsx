import QRCode from "qrcode";
import { requireAdmin } from "@/lib/auth";
import { SITE_URL } from "@/lib/utils";
import { CLUB_LOGO } from "@/components/site/Wordmark";

export const metadata = { title: "Attendance poster" };

export default async function Poster() {
  await requireAdmin("attendance");
  const url = `${SITE_URL()}/attend`;
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#151515", light: "#ffffff" } });
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-white text-ink">
      <div className="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center px-8 py-10 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={CLUB_LOGO} alt="Rotary Club of Gayaza" className="h-16 w-auto" />
        <h1 className="mt-8 text-[2.6rem] leading-tight">Welcome to the meeting.</h1>
        <p className="mt-3 font-sans text-lg text-muted">Scan to sign in — members and guests.</p>
        <div className="mt-8 w-full max-w-[min(62vh,460px)]" dangerouslySetInnerHTML={{ __html: svg }} role="img" aria-label="Attendance QR code" />
        <ol className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 font-sans text-sm font-bold uppercase tracking-[0.16em] text-ink-2">
          <li>1. Open your camera</li><li>2. Scan the code</li><li>3. Fill in the short form</li>
        </ol>
        <p className="mt-6 font-sans text-sm text-muted">{url.replace(/^https?:\/\//, "")}</p>
      </div>
    </div>
  );
}
