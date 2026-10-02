import Link from "next/link";
import { Wordmark } from "./Wordmark";
import { MobileNav } from "./MobileNav";
import { PRIMARY_NAV, SECONDARY_NAV } from "./nav";

export function Header({ logoUrl, overlay = false }: { logoUrl?: string | null; overlay?: boolean }) {
  return (
    <header className={overlay ? "absolute inset-x-0 top-0 z-40" : "sticky top-0 z-40 border-b border-line/70 bg-paper/90 backdrop-blur"}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-gold focus:px-3 focus:py-2 focus:text-ink">Skip to content</a>
      <div className="wrap flex h-[72px] items-center justify-between gap-6">
        <Wordmark logoUrl={logoUrl} tone={overlay ? "light" : "dark"} />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {PRIMARY_NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`rounded-full px-3 py-2 text-sm font-semibold transition-colors ${overlay ? "text-white/90 hover:text-gold" : "text-ink-2 hover:text-royal"}`}>{n.label}</Link>
          ))}
          <Link href="/contact" className={`btn ml-3 !py-2 ${overlay ? "btn-gold" : "btn-royal"}`}>Get involved</Link>
          <Link href="/member" className={`ml-1 rounded-full px-3 py-2 text-sm font-semibold ${overlay ? "text-white/80 hover:text-white" : "text-muted hover:text-ink"}`}>Members</Link>
        </nav>
        <MobileNav items={[...PRIMARY_NAV, ...SECONDARY_NAV]} overlay={overlay} />
      </div>
    </header>
  );
}
