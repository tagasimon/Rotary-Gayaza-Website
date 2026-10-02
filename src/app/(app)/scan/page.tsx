import { Scanner } from "./Scanner";
export const metadata = { title: "Scan to check in", robots: { index: false } };
export default function ScanPage() {
  return (<div><h1 className="display text-3xl">Scan the meeting code</h1><p className="mt-1 text-sm text-ink-2">Point your camera at the QR code on screen. Your phone&rsquo;s own camera app works too.</p><div className="mt-5"><Scanner /></div></div>);
}
