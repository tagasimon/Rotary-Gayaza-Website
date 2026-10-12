"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type TimelineItem = { id: string; dateLabel: string; title: string; description?: string | null; kind: string; href?: string | null; upcoming?: boolean; pending?: boolean; sourceUrl?: string | null; sourceLabel?: string | null };

const KIND_LABEL: Record<string, string> = { FORMATION: "Roots", CHARTER: "Charter", MILESTONE: "Milestone", PROJECT: "Service", YOUTH_CLUB: "New branch", LEADERSHIP: "Leadership", DG_VISIT: "Governor", UPCOMING: "Next" };

/** Horizontal "2021 → TODAY → NEXT" rail on desktop (native scroll, no hijacking); vertical on mobile. */
export function Timeline({ items, pan = false }: { items: TimelineItem[]; pan?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setVis(true), io.disconnect()), { threshold: 0.15 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  const todayIdx = items.findIndex((i) => i.upcoming);
  return (
    <div ref={ref} className={pan ? "tl-pan is-visible" : vis ? "is-visible" : ""}>
      <div className={pan ? "pb-2" : "no-scrollbar -mx-4 overflow-x-auto px-4 pb-6 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10"} {...(pan ? {} : { tabIndex: 0 })} aria-label="Club timeline">
        <ol {...(pan ? { "data-sc-pan": "0.04" } : {})} style={{ "--n": items.length } as React.CSSProperties}
          className={`relative flex min-w-max gap-0 pt-0 ${pan ? "pl-4 pr-[30vw] sm:pl-6 lg:pl-[max(2.5rem,calc((100vw-1240px)/2+2.5rem))]" : ""}`}>
          <span aria-hidden className="rail absolute left-0 right-0 top-[62px] h-px bg-soil/70" />
          {items.map((it, i) => {
            const isToday = i === todayIdx;
            return (
              <li key={it.id} className="relative w-[250px] shrink-0 pr-8 transition-all duration-700 sm:w-[290px]" style={pan ? ({ "--i": i } as React.CSSProperties) : { opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(14px)", transitionDelay: `${i * 0.08}s` }}>
                {isToday && <span className="eyebrow absolute top-2 left-0 rounded-full bg-royal px-3 py-1 text-gold">Today →</span>}
                <span aria-hidden className={`absolute left-0 top-[55px] block h-[14px] w-[14px] rounded-full border-2 ${it.upcoming ? "border-gold bg-paper" : "border-soil bg-soil"}`} />
                <p className="eyebrow mt-[86px] text-soil">{KIND_LABEL[it.kind] ?? it.kind}</p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-ink-2">{it.dateLabel}</p>
                <h3 className="mt-2 text-2xl leading-tight text-ink">{it.href ? <Link href={it.href} className="hover:text-royal">{it.title}</Link> : it.title}</h3>
                {it.description && <p className="mt-2 text-sm leading-relaxed text-ink-2">{it.description}</p>}
                {it.sourceUrl ? (
                  <a href={it.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[0.7rem] uppercase tracking-wider text-muted underline decoration-line hover:text-royal">Source ↗</a>
                ) : it.pending ? <span className="mt-2 inline-block text-[0.7rem] uppercase tracking-wider text-muted">Club records</span> : null}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
