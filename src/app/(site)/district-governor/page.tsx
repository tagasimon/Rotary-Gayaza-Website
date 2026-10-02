import type { Metadata } from "next";
import Link from "next/link";
import { getDGVisits } from "@/lib/queries";
import { STATUS_LABEL } from "@/lib/dg";
import { Countdown } from "@/components/site/Countdown";
import { Markdown } from "@/components/site/Markdown";
import { Gallery } from "@/components/site/Gallery";
import { Img } from "@/components/site/Img";
import { Provenance } from "@/components/site/Provenance";
import { formatDate } from "@/lib/time";

export const metadata: Metadata = { title: "The Governor's Visits", description: "Every official visit by a Rotary District 9213 Governor to the Rotary Club of Gayaza — past, upcoming and next.", alternates: { canonical: "/district-governor" } };

export default async function GovernorPage() {
  const visits = await getDGVisits();
  const next = visits.find((v) => v.visitStatus === "TODAY") ?? visits.find((v) => v.visitStatus === "NEXT");
  const upcoming = visits.filter((v) => v.visitStatus === "UPCOMING");
  const past = visits.filter((v) => v.visitStatus === "COMPLETED");
  return (
    <>
      <section className="relative overflow-hidden bg-royal pb-16 pt-20 text-white sm:pt-28">
        <div aria-hidden className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full border border-gold/30" />
        <div aria-hidden className="absolute -right-20 -top-20 h-[360px] w-[360px] rounded-full border border-gold/20" />
        <div className="wrap relative">
          <p className="eyebrow text-gold">Rotary District 9213</p>
          <h1 className="mt-4 text-6xl leading-[0.95] sm:text-8xl">The Governor&rsquo;s Visits</h1>
          <p className="mt-6 max-w-2xl text-xl text-white/80">Once each Rotary year, the District Governor makes an official visit to the club. Every visit is kept here as part of the club's archive.</p>
          {next && (
            <div className="mt-14 grid gap-8 border-t border-white/20 pt-10 md:grid-cols-12">
              <div className="md:col-span-7">
                <span className="inline-block rounded-full bg-gold px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-ink">{STATUS_LABEL[next.visitStatus]}</span>
                <p className="display mt-4 text-5xl">DG {next.governorName}</p>
                <p className="mt-2 text-xl text-white/85">{formatDate(next.date, "day")}{next.timeLabel ? ` · ${next.timeLabel}` : ""}{next.venue ? ` · ${next.venue}` : ""}</p>
                {next.summary && <p className="mt-4 max-w-xl text-white/75">{next.summary}</p>}
                <Provenance className="mt-4 !text-white/60" label={next.sourceLabel} url={next.sourceUrl} verification={next.verification} />
              </div>
              <div className="md:col-span-5 md:justify-self-end"><Countdown to={next.date.toISOString()} /></div>
            </div>
          )}
        </div>
      </section>

      {upcoming.length > 0 && (
        <section className="py-16"><div className="wrap"><h2 className="eyebrow mb-6 text-soil">Upcoming</h2>
          <ul className="space-y-4">{upcoming.map((v) => <li key={v.id} className="border-t border-line pt-4"><p className="display text-3xl">DG {v.governorName} · {v.rotaryYear}</p><p className="text-ink-2">{formatDate(v.date, "day")}{v.venue ? ` · ${v.venue}` : ""}</p></li>)}</ul>
        </div></section>
      )}

      <section className="py-20" aria-labelledby="past-h">
        <div className="wrap">
          <h2 id="past-h" className="mb-12 text-5xl">Past visits</h2>
          {past.length === 0 && <p className="text-ink-2">The archive of past visits is being compiled.</p>}
          <ol className="relative space-y-24 border-l border-soil/40 pl-8 sm:pl-12">
            {past.map((v) => (
              <li key={v.id} className="relative">
                <span aria-hidden className="absolute -left-[39px] top-3 h-4 w-4 rounded-full bg-soil sm:-left-[55px]" />
                <div className="grid gap-10 md:grid-cols-12">
                  <div className="md:col-span-5">
                    <p className="eyebrow text-soil">Rotary year {v.rotaryYear} · {STATUS_LABEL[v.visitStatus]}</p>
                    <h3 className="mt-2 text-4xl">District Governor {v.governorName}</h3>
                    <p className="mt-2 text-ink-2">{formatDate(v.date, "day")}{v.timeLabel ? ` · ${v.timeLabel}` : ""}{v.venue ? ` · ${v.venue}` : ""}</p>
                    {v.summary && <p className="mt-5 text-lg leading-relaxed">{v.summary}</p>}
                    {v.projectsHighlighted.length > 0 && (
                      <div className="mt-6"><p className="eyebrow text-muted">Projects highlighted</p><ul className="mt-2 flex flex-wrap gap-2">{v.projectsHighlighted.map((p) => <li key={p} className="chip">{p}</li>)}</ul></div>
                    )}
                    <Provenance className="mt-6" label={v.sourceLabel} url={v.sourceUrl} verification={v.verification} />
                  </div>
                  <div className="md:col-span-7">
                    {v.heroImageUrl && <div className="relative aspect-[3/2] overflow-hidden bg-paper-2"><Img src={v.heroImageUrl} alt={`District Governor ${v.governorName}'s visit`} fill sizes="(min-width: 768px) 55vw, 100vw" className="object-cover" /></div>}
                    {v.story && <div className="mt-6"><Markdown className="prose-plain text-ink-2">{v.story}</Markdown></div>}
                    {v.message && <blockquote className="display mt-6 border-l-2 border-gold pl-5 text-2xl italic">“{v.message}”</blockquote>}
                  </div>
                </div>
                {v.album && v.album.media.length > 0 && (
                  <div className="mt-10">
                    <Gallery photos={v.album.media.slice(0, 8)} />
                    <Link href={`/gallery/${v.album.slug}`} className="link-arrow mt-4">All photographs from this visit</Link>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
