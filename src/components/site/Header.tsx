import Link from "next/link";
import { Wordmark } from "./Wordmark";
import { MobileNav } from "./MobileNav";
import { PRIMARY_NAV, SECONDARY_NAV } from "./nav";

export function Header({ logoUrl }: { logoUrl?: string | null; overlay?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-sm">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-gold focus:px-3 focus:py-2 focus:text-ink">Skip to content</a>
      <div className="wrap flex h-[78px] items-center justify-between gap-6">
        <Wordmark logoUrl={logoUrl} />
        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          {PRIMARY_NAV.map((n) => (
            <Link key={n.href} href={n.href} className="font-sans text-[0.7rem] font-bold uppercase tracking-[0.18em] text-ink-2 transition-colors hover:text-royal">{n.label}</Link>
          ))}
          <Link href="/attend" className="btn btn-dark !min-h-0 !px-5 !py-3">Sign in</Link>
        </nav>
        <MobileNav items={[...PRIMARY_NAV, ...SECONDARY_NAV]} />
      </div>
    </header>
  );
}
