"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Item = { href: string; label: string; badge?: number };
export function Sidebar({ groups, user }: { groups: { group: string; items: Item[] }[]; user: { name: string; role: string } }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (h: string) => (h === "/admin" ? path === "/admin" : path.startsWith(h));
  return (
    <>
      <div className="flex h-14 items-center justify-between border-b border-ink/10 bg-ink px-4 text-white lg:hidden">
        <Link href="/admin" className="display text-lg">RC Gayaza · Admin</Link>
        <button onClick={() => setOpen(!open)} aria-expanded={open} className="h-11 px-2 text-sm font-semibold">{open ? "Close" : "Menu"}</button>
      </div>
      <aside className={`${open ? "block" : "hidden"} w-full shrink-0 bg-ink text-white/80 lg:sticky lg:top-0 lg:block lg:h-svh lg:w-60 lg:overflow-y-auto`}>
        <div className="hidden px-5 pb-4 pt-6 lg:block">
          <Link href="/admin" className="block leading-none"><span className="block text-[0.55rem] font-semibold uppercase tracking-[0.28em] text-gold">Rotary Club of</span><span className="display text-2xl text-white">Gayaza</span></Link>
          <p className="mt-1 text-xs text-white/40">Club admin</p>
        </div>
        <nav aria-label="Admin" className="px-3 pb-6">
          {groups.map((g) => (
            <div key={g.group} className="mt-4">
              <p className="px-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/35">{g.group}</p>
              <ul className="mt-1">
                {g.items.map((i) => (
                  <li key={i.href}>
                    <Link href={i.href} onClick={() => setOpen(false)} aria-current={active(i.href) ? "page" : undefined}
                      className={`flex items-center justify-between rounded px-2 py-1.5 text-sm ${active(i.href) ? "bg-white/10 font-semibold text-white" : "hover:bg-white/5 hover:text-white"}`}>
                      {i.label}{!!i.badge && <span className="rounded-full bg-gold px-1.5 text-[0.65rem] font-bold text-ink">{i.badge}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="mt-8 border-t border-white/10 px-2 pt-4 text-xs">
            <p className="text-white">{user.name}</p><p className="text-white/40">{user.role}</p>
            <div className="mt-3 flex gap-3"><Link href="/" className="underline hover:text-white" target="_blank">View site ↗</Link><Link href="/admin/account" className="underline hover:text-white">Account</Link></div>
          </div>
        </nav>
      </aside>
    </>
  );
}
