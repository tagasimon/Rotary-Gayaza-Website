import Link from "next/link";
import type { Event, Project, Story } from "@prisma/client";
import { Img } from "./Img";
import { formatDate, formatTime, localParts } from "@/lib/time";
import { excerpt } from "@/lib/utils";

/** "Our latest projects" style: arrow, date line, uppercase title, serif summary. */
export function ProjectListItem({ p }: { p: Project }) {
  return (
    <article className="font-sans">
      <span aria-hidden className="text-ink">➔</span>
      <p className="mt-2 text-[0.95rem] font-bold uppercase tracking-[0.04em] text-ink">{p.dateLabel ?? p.rotaryYear ?? "Ongoing"}</p>
      <h3 className="mt-3 font-sans text-[0.78rem] font-bold uppercase leading-relaxed tracking-[0.06em] text-ink-2">
        <Link href={`/projects/${p.slug}`} className="hover:text-royal">{p.title}</Link>
      </h3>
      {p.summary && <p className="body-serif mt-3">{p.summary}</p>}
      <Link href={`/projects/${p.slug}`} className="link-arrow mt-4">Read more</Link>
    </article>
  );
}

export function ProjectFeature({ p, flip = false }: { p: Project; flip?: boolean; index?: number }) {
  return (
    <article className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
      <Link href={`/projects/${p.slug}`} className={`group relative block aspect-[4/3] overflow-hidden bg-paper-2 ${flip ? "md:order-2" : ""}`}>
        {p.heroImageUrl ? <Img src={p.heroImageUrl} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
          : <div className="absolute inset-0 grid place-items-center bg-night"><span className="display px-6 text-center text-3xl text-white">{p.peopleReached || p.title}</span></div>}
      </Link>
      <div>
        <p className="eyebrow text-royal">{[p.impactCategory, p.dateLabel].filter(Boolean).join(" · ")}</p>
        <h3 className="mt-3 text-[1.7rem] leading-[1.25]"><Link href={`/projects/${p.slug}`} className="hover:text-royal">{p.title}.</Link></h3>
        {p.summary && <p className="body-serif mt-4">{p.summary}</p>}
        <Link href={`/projects/${p.slug}`} className="link-arrow mt-6">Read the story</Link>
      </div>
    </article>
  );
}

export function ProjectCard({ p }: { p: Project }) {
  return (
    <article className="group flex flex-col">
      <Link href={`/projects/${p.slug}`} className="relative mb-5 block aspect-[3/2] overflow-hidden bg-paper-2">
        {p.heroImageUrl ? <Img src={p.heroImageUrl} alt="" fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
          : <div className="absolute inset-0 grid place-items-center bg-night"><span className="display text-3xl text-white">{p.peopleReached || "—"}</span></div>}
      </Link>
      <p className="eyebrow text-royal">{[p.impactCategory, p.dateLabel].filter(Boolean).join(" · ")}</p>
      <h3 className="mt-2 text-[1.3rem] leading-snug"><Link href={`/projects/${p.slug}`} className="hover:text-royal">{p.title}.</Link></h3>
      {p.summary && <p className="body-serif mt-2 text-[0.92rem]">{excerpt(p.summary, 160)}</p>}
      {p.location && <p className="mt-3 font-sans text-xs uppercase tracking-[0.14em] text-muted">{p.location}</p>}
    </article>
  );
}

export function StoryCard({ s, size = "md" }: { s: Story; size?: "lg" | "md" }) {
  return (
    <article className="group">
      <Link href={`/stories/${s.slug}`} className={`relative mb-5 block overflow-hidden bg-night ${size === "lg" ? "aspect-[16/10]" : "aspect-[4/3]"}`}>
        {s.heroImageUrl && <Img src={s.heroImageUrl} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.02]" />}
      </Link>
      <p className="eyebrow text-royal">{[s.place, s.publishedAt ? formatDate(s.publishedAt, "short") : null].filter(Boolean).join(" · ")}</p>
      <h3 className={`mt-2 leading-tight ${size === "lg" ? "text-[1.9rem]" : "text-[1.35rem]"}`}><Link href={`/stories/${s.slug}`} className="hover:text-royal">{s.title}.</Link></h3>
      {s.dek && <p className="body-serif mt-3">{s.dek}</p>}
    </article>
  );
}

export function EventRow({ e, compact = false }: { e: Event; compact?: boolean }) {
  const p = localParts(e.startsAt);
  const month = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "Africa/Kampala" }).format(e.startsAt);
  return (
    <li className={`grid grid-cols-[60px_1fr] gap-4 border-t border-line py-5 ${compact ? "" : "sm:grid-cols-[80px_1fr_auto] sm:gap-6"}`}>
      <div className="text-center font-sans">
        <div className="display text-[2.2rem] leading-none text-ink">{p.d}</div>
        <div className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-royal">{month}</div>
      </div>
      <div>
        <h3 className="text-[1.15rem] leading-snug"><Link href={`/events/${e.slug}`} className="hover:text-royal">{e.title}</Link></h3>
        <p className="mt-1 font-sans text-sm text-muted">
          {formatDate(e.startsAt, "day")}{!e.allDay && !e.timeTbc ? ` · ${formatTime(e.startsAt)}` : ""}{e.venue ? ` · ${e.venue}` : ""}
        </p>
        {e.organiser && <p className="mt-1 font-sans text-xs text-muted">{e.organiser}</p>}
      </div>
      <div className={`col-span-2 flex flex-wrap items-start gap-2 ${compact ? "col-start-2 -mt-2" : "sm:col-span-1"}`}>
        {e.type === "DG_VISIT" && <span className="chip border-gold">Governor&rsquo;s visit</span>}
        {e.sourceUrl && e.scope !== "CLUB" && <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer" className="chip hover:text-royal">Source ↗</a>}
      </div>
    </li>
  );
}
