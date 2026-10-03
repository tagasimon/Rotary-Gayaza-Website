import Link from "next/link";

/**
 * Official club logo (Rotary Brand Center "Rotary Club of Gayaza" lockup), always used unchanged.
 * It is a full-colour mark for light backgrounds, so over photos/dark bands it sits on a white tile
 * rather than being recoloured. The Rotary wheel is never redrawn.
 */
export const CLUB_LOGO = "/brand/rc-gayaza-logo.png";

export function Wordmark({ logoUrl, compact = false, onDark = false, tone }: { logoUrl?: string | null; compact?: boolean; onDark?: boolean; tone?: "dark" | "light" }) {
  const tile = onDark || tone === "light";
  return (
    <Link href="/" aria-label="Rotary Club of Gayaza home"
      className={`inline-flex items-center transition-all duration-300 ${tile ? "rounded-lg bg-white px-3 py-1.5 shadow-[0_6px_20px_-8px_rgba(0,0,0,.45)]" : "px-0 py-0"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoUrl || process.env.NEXT_PUBLIC_CLUB_LOGO || CLUB_LOGO} alt="Rotary Club of Gayaza" width={186} height={75}
        className={`w-auto transition-[height] duration-300 ${compact ? "h-9 sm:h-10" : "h-11 sm:h-[52px]"}`} />
    </Link>
  );
}
