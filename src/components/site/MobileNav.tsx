"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function MobileNav({ items }: { items: { href: string; label: string }[] }) {
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
      <button type="button" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(true)} className="flex h-11 items-center gap-3 font-sans text-[0.68rem] font-bold uppercase tracking-[0.2em] text-ink-2">
        Menu
        <span aria-hidden className="flex flex-col gap-[5px]"><i className="block h-[2px] w-5 bg-current" /><i className="block h-[2px] w-5 bg-current" /><i className="block h-[2px] w-5 bg-current" /></span>
      </button>
      {open && (
        <div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Site menu" className="fixed inset-0 z-50 flex flex-col bg-night text-white">
          <div className="wrap flex h-[78px] items-center justify-between">
            <span className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.3em] text-white/50">Rotary Club of Gayaza</span>
            <button type="button" onClick={() => setOpen(false)} className="h-11 font-sans text-[0.68rem] font-bold uppercase tracking-[0.2em]" autoFocus>Close ✕</button>
          </div>
          <nav aria-label="Mobile" className="wrap flex-1 overflow-y-auto pb-10 pt-4">
            <ul>
              {items.map((n) => (
                <li key={n.href} className="border-b border-white/10"><Link href={n.href} className="display block py-4 text-[1.6rem] hover:text-gold">{n.label}.</Link></li>
              ))}
            </ul>
            <Link href="/attend" className="btn btn-gold mt-8 w-full">Sign in to fellowship</Link>
          </nav>
        </div>
      )}
    </div>
  );
}
