import Link from "next/link";

/**
 * Official club logo (Rotary Brand Center "Rotary Club of Gayaza" lockup), used unchanged on
 * light backgrounds. On dark backgrounds we use a plain text name rather than recolouring the mark.
 */
export const CLUB_LOGO = "/brand/rc-gayaza-logo.png";

export function Wordmark({ logoUrl, tone = "dark" }: { logoUrl?: string | null; tone?: "dark" | "light" }) {
  if (tone === "light") {
    return (
      <Link href="/" className="inline-block leading-none text-white" aria-label="Rotary Club of Gayaza — home">
        <span className="block font-sans text-[0.62rem] font-bold uppercase tracking-[0.3em] text-white/60">Rotary Club of</span>
        <span className="display mt-1 block text-[1.6rem]">Gayaza</span>
      </Link>
    );
  }
  return (
    <Link href="/" className="inline-flex items-center" aria-label="Rotary Club of Gayaza — home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoUrl || process.env.NEXT_PUBLIC_CLUB_LOGO || CLUB_LOGO} alt="Rotary Club of Gayaza" width={186} height={75} className="h-11 w-auto sm:h-[52px]" />
    </Link>
  );
}
