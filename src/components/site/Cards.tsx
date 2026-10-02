import Link from "next/link";
import type { Event, Project, Story } from "@prisma/client";
import { Img } from "./Img";
import { formatDate, formatTime, localParts } from "@/lib/time";
import { excerpt } from "@/lib/utils";

export function ProjectFeature({ p, flip = false, index }: { p: Project; flip?: boolean; index?: number }) {
  return (
    <article className="grid items-center gap-6 md:grid-cols-12 md:gap-10">
      <Link href={`/projects/${p.slug}`} className={`group relative block aspect-[4/3] overflow-hidden bg-royal md:col-span-7 ${flip ? "md:order-2" : ""}`}>
        {p.heroImageUrl ? (
          <Img src={p.heroImageUrl} alt="" fill sizes="(min-width: 768px) 58vw, 100vw" className="object-cover transition-transform duration-[1.2s] ease-[var(--ease-story)] group-hover:scale-[1.03]" />
        ) : (
          <div className="absolute inset-0 grid place-items-center p-8">
            <p className="display text-center text-4xl leading-tight text-white/90 sm:text-5xl">{p.peopleReached || p.impactCategory || p.title}</p>
          </div>
        )}
        {typeof index === "number" && <span className="display absolute left-4 top-3 text-6xl text-white/90 mix-blend-difference">{String(index + 1).padStart(2, "0")}</span>}
      </Link>
      <div className={`md:col-span-5 ${flip ? "md:order-1" : ""}`}>
        <p className="eyebrow text-soil">{[p.impactCategory, p.dateLabel].filter(Boolean).join(" · ")}</p>
        <h3 className="mt-3 text-3xl leading-tight sm:text-4xl"><Link href={`/projects/${p.slug}`} className="hover:text-royal">{p.title}</Link></h3>
        {p.summary && <p className="mt-4 text-lg leading-relaxed text-ink-2">{p.summary}</p>}
        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm">
          {p.location && <div><dt className="eyebrow text-muted">Where</dt><dd className="mt-1 font-semibold">{p.location}</dd></div>}
          {p.peopleReached && <div><dt className="eyebrow text-muted">Reached</dt><dd className="mt-1 font-semibold">{p.peopleReached}</dd></div>}
          {p.areaOfFocus && <div className="col-span-2"><dt className="eyebrow text-muted">Area of focus</dt><dd className="mt-1">{p.areaOfFocus}</dd></div>}
        </dl>
        <Link href={`/projects/${p.slug}`} className="link-arrow mt-5">The full story</Link>
      </div>
    </article>
  );
}

export function ProjectCard({ p }: { p: Project }) {
  return (
    <article className="group flex flex-col border-t-2 border-ink pt-4">
      <Link href={`/projects/${p.slug}`} className="relative mb-4 block aspect-[3/2] overflow-hidden bg-paper-2">
        {p.heroImageUrl ? <Img src={p.heroImageUrl} alt="" fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
          : <div className="absolute inset-0 grid place-items-center bg-royal"><span className="display text-4xl text-white">{p.peopleReached || "—"}</span></div>}
      </Link>
      <p className="eyebrow text-soil">{[p.impactCategory, p.dateLabel].filter(Boolean).join(" · ")}</p>
      <h3 className="mt-2 text-2xl leading-snug"><Link href={`/projects/${p.slug}`} className="hover:text-royal">{p.title}</Link></h3>
      {p.summary && <p className="mt-2 text-ink-2">{excerpt(p.summary, 160)}</p>}
      {p.location && <p className="mt-3 text-sm text-muted">{p.location}</p>}
    </article>
  );
}

export function StoryCard({ s, size = "md" }: { s: Story; size?: "lg" | "md" }) {
  return (
    <article className="group">
      <Link href={`/stories/${s.slug}`} className={`relative mb-4 block overflow-hidden bg-royal ${size === "lg" ? "aspect-[16/10]" : "aspect-[4/3]"}`}>
        {s.heroImageUrl ? <Img src={s.heroImageUrl} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
          : <div className="absolute inset-0 p-6"><span className="display text-7xl leading-none text-gold/90">“</span></div>}
      </Link>
      <p className="eyebrow text-soil">{[s.place, s.publishedAt ? formatDate(s.publishedAt, "short") : null].filter(Boolean).join(" · ")}</p>
      <h3 className={`mt-2 leading-tight ${size === "lg" ? "text-4xl" : "text-2xl"}`}><Link href={`/stories/${s.slug}`} className="hover:text-royal">{s.title}</Link></h3>
      {s.dek && <p className="mt-2 text-ink-2">{s.dek}</p>}
    </article>
  );
}

export function EventRow({ e, compact = false }: { e: Event; compact?: boolean }) {
  const p = localParts(e.startsAt);
  const month = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "Africa/Kampala" }).format(e.startsAt);
  return (
    <li className={`group grid grid-cols-[64px_1fr] gap-4 border-t border-line py-5 ${compact ? "" : "sm:grid-cols-[88px_1fr_auto] sm:gap-6"}`}>
      <div className="text-center">
        <div className="display text-4xl leading-none text-royal sm:text-5xl">{p.d}</div>
        <div className="eyebrow mt-1 text-soil">{month} {p.y !== new Date().getFullYear() ? p.y : ""}</div>
      </div>
      <div>
        <h3 className={`leading-snug ${compact ? "text-xl" : "text-xl sm:text-2xl"}`}><Link href={`/events/${e.slug}`} className="hover:text-royal">{e.title}</Link></h3>
        <p className="mt-1 text-sm text-ink-2">
          {formatDate(e.startsAt, "day")}{!e.allDay && !e.timeTbc ? ` · ${formatTime(e.startsAt)}` : e.timeTbc ? " · time to be confirmed" : ""}
          {e.venue ? ` · ${e.venue}` : ""}
        </p>
        {e.organiser && <p className="mt-1 text-xs text-muted">{e.organiser}</p>}
      </div>
      <div className={`col-span-2 flex flex-wrap items-start gap-2 ${compact ? "col-start-2 -mt-2" : "sm:col-span-1"}`}>
        {e.type === "DG_VISIT" && <span className="chip border-gold bg-gold/15">Governor's visit</span>}
        {e.sourceUrl && e.scope !== "CLUB" && <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer" className="chip hover:text-royal">Source ↗</a>}
      </div>
    </li>
  );
}
