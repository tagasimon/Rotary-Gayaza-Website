import Link from "next/link";

/**
 * Club identity. If the official club logo (from Rotary Brand Center) is configured via
 * Club.logoUrl or NEXT_PUBLIC_CLUB_LOGO, it is shown unchanged. Otherwise a neutral text
 * lockup is used — we never redraw the Rotary wheel or Masterbrand Signature.
 */
export function Wordmark({ logoUrl, tone = "dark" }: { logoUrl?: string | null; tone?: "dark" | "light" }) {
  const logo = logoUrl || process.env.NEXT_PUBLIC_CLUB_LOGO;
  return (
    <Link href="/" className="group inline-flex items-center gap-3" aria-label="Rotary Club of Gayaza — home">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="Rotary Club of Gayaza" className="h-10 w-auto sm:h-12" />
      ) : (
        <span className={`leading-none ${tone === "light" ? "text-white" : "text-royal"}`}>
          <span className={`block text-[0.62rem] font-semibold uppercase tracking-[0.28em] ${tone === "light" ? "text-gold" : "text-ink-2"}`}>Rotary Club of</span>
          <span className="display block text-[1.7rem] font-semibold tracking-tight">Gayaza</span>
        </span>
      )}
    </Link>
  );
}
