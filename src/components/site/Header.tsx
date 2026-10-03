"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Wordmark } from "./Wordmark";
import { MobileNav } from "./MobileNav";
import { PRIMARY_NAV, SECONDARY_NAV } from "./nav";

/**
 * Scroll-aware header.
 * - overlay (homepage): see-through over the hero photo, white links.
 * - once the page scrolls: a compact, frosted white bar with a soft shadow.
 * - scrolling down hides it; any scroll up brings it straight back.
 */
export function Header({ logoUrl, overlay = false }: { logoUrl?: string | null; overlay?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);
  const path = usePathname();

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 24);
        const delta = y - last.current;
        if (y < 160) setHidden(false);
        else if (delta > 6) setHidden(true);
        else if (delta < -6) setHidden(false);
        last.current = y;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  const clear = overlay && !scrolled; // transparent state
  const isActive = (href: string) => path === href || path.startsWith(href + "/");

  return (
    <header
      data-state={clear ? "clear" : "solid"}
      className={[
        overlay ? "fixed" : "sticky",
        "inset-x-0 top-0 z-40 transition-[transform,background-color,box-shadow,backdrop-filter] duration-300 ease-[var(--ease-story)]",
        hidden ? "-translate-y-full" : "translate-y-0",
        clear
          ? "bg-gradient-to-b from-royal-ink/55 to-transparent"
          : scrolled
            ? "bg-white/85 shadow-[0_8px_30px_-12px_rgba(15,52,116,.35)] backdrop-blur-md backdrop-saturate-150"
            : "bg-paper/70 backdrop-blur-md",
      ].join(" ")}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-gold focus:px-3 focus:py-2 focus:text-ink">Skip to content</a>
      <div className={`wrap flex items-center justify-between gap-6 transition-[height] duration-300 ${scrolled ? "h-[64px]" : "h-[84px]"}`}>
        <Wordmark logoUrl={logoUrl} compact={scrolled} onDark={clear} />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {PRIMARY_NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? "page" : undefined}
              className={[
                "relative rounded-full px-3 py-2 text-[0.9rem] font-semibold transition-colors",
                "after:absolute after:inset-x-3 after:-bottom-0.5 after:h-[2px] after:origin-left after:scale-x-0 after:bg-gold after:transition-transform hover:after:scale-x-100",
                isActive(n.href) ? "after:scale-x-100" : "",
                clear ? "text-white hover:text-gold-soft" : "text-ink-2 hover:text-royal",
              ].join(" ")}>
              {n.label}
            </Link>
          ))}
          <Link href="/attend" className={`btn ml-3 !min-h-0 !py-2.5 ${clear ? "btn-gold" : "btn-royal"}`}>Meeting sign-in</Link>
        </nav>
        <MobileNav items={[...PRIMARY_NAV, ...SECONDARY_NAV]} onDark={clear} />
      </div>
    </header>
  );
}
