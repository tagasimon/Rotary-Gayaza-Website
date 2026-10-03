"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function MobileNav({ items, onDark }: { items: { href: string; label: string }[]; onDark?: boolean }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <div className="lg:hidden">
      <button type="button" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(true)}
        className={`flex h-11 items-center gap-2 rounded-full px-3 text-sm font-bold ${onDark ? "text-white" : "text-royal"}`}>
        <span>Menu</span>
        <span aria-hidden className="flex flex-col gap-[5px]"><i className="block h-[2px] w-5 bg-current" /><i className="block h-[2px] w-3.5 self-end bg-gold" /></span>
      </button>
      {open && (
        <div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Site menu" className="band-royal fixed inset-0 z-50 flex flex-col text-white">
          <div className="wrap flex h-[84px] items-center justify-between">
            <span className="eyebrow text-gold">Rotary Club of Gayaza</span>
            <button type="button" onClick={() => setOpen(false)} className="h-11 rounded-full px-3 text-sm font-bold" autoFocus>Close ✕</button>
          </div>
          <nav aria-label="Mobile" className="wrap flex-1 overflow-y-auto pb-10">
            <ul className="divide-y divide-white/15 border-y border-white/15">
              {items.map((n) => (
                <li key={n.href}><Link href={n.href} className="display flex items-center justify-between py-4 text-[1.7rem] hover:text-gold">{n.label}<span aria-hidden className="text-base text-gold">→</span></Link></li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3">
              <Link href="/attend" className="btn btn-gold">Fellowship sign-in</Link>
              <Link href="/contact?interest=join" className="btn btn-ghost text-white">Join / get involved</Link>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
