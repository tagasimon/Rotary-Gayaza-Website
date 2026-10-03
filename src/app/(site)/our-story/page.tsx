import type { Metadata } from "next";
import Link from "next/link";
import { getStoryChapters, getTimeline, getHomeClub } from "@/lib/queries";
import { PageHero } from "@/components/site/PageHero";
import { Markdown } from "@/components/site/Markdown";
import { Img } from "@/components/site/Img";
import { Reveal, ImageReveal } from "@/components/site/Reveal";
import { Provenance } from "@/components/site/Provenance";

export const metadata: Metadata = { title: "Our Story", description: "How the Rotary Club of Gayaza began in June 2021, was chartered on 16 December 2021, and grew a family of youth clubs.", alternates: { canonical: "/our-story" } };

export default async function OurStory() {
  const [chapters, timeline, club] = await Promise.all([getStoryChapters(), getTimeline(), getHomeClub()]);
  const byChapter = (key: string) => timeline.filter((t) => t.chapter === key);
  const now = new Date();
  return (
    <>
      <PageHero eyebrow="Our story · 2021 → today" title="Roots, people, service, legacy." intro={`From a group meeting in Gayaza in mid-2021 to a chartered club in Rotary District ${club.district} with a family of youth clubs of its own.`} />
      {chapters.map((c, ci) => {
        const key = c.key.replace("story.", "");
        const entries = byChapter(key);
        return (
          <section key={c.id} className={`py-20 sm:py-28 ${ci % 2 ? "bg-paper-2" : ""}`} aria-labelledby={`ch-${key}`}>
            <div className="wrap grid gap-12 md:grid-cols-12">
              <header className="md:col-span-4">
                <p className="eyebrow text-soil">{c.eyebrow}</p>
                <h2 id={`ch-${key}`} className="mt-3 text-5xl leading-none sm:text-6xl">{c.title}</h2>
              </header>
              <div className="md:col-span-7 md:col-start-6">
                <Markdown>{c.body}</Markdown>
                {entries.length > 0 && (
                  <ol className="relative mt-12 space-y-10 border-l border-soil/50 pl-8">
                    {entries.map((t) => (
                      <Reveal as="li" key={t.id} className="relative">
                        <span aria-hidden className={`absolute -left-[39px] top-1.5 h-3.5 w-3.5 rounded-full border-2 ${t.date > now ? "border-gold bg-paper" : "border-soil bg-soil"}`} />
                        <p className="text-sm font-semibold tabular-nums text-soil">{t.dateLabel}</p>
                        <h3 className="mt-1 text-2xl">{t.linkUrl ? <Link href={t.linkUrl} className="hover:text-royal">{t.title}</Link> : t.title}</h3>
                        {t.description && <p className="mt-2 text-ink-2">{t.description}</p>}
                        {t.imageUrl && (
                          <ImageReveal className="relative mt-5 aspect-[16/9] overflow-hidden bg-paper-2">
                            <Img src={t.imageUrl} alt="" fill sizes="(min-width:768px) 55vw, 100vw" className="object-cover" />
                          </ImageReveal>
                        )}
                        <Provenance className="mt-2" label={t.sourceLabel} url={t.sourceUrl} verification={t.verification} />
                      </Reveal>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </section>
        );
      })}
      <section className="band-royal py-20 text-white">
        <div className="wrap flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <p className="display max-w-2xl text-4xl leading-tight">The next chapter is written on Sundays at {club.meetingTime}.</p>
          <Link href="/contact?interest=visit" className="btn btn-gold">Visit a meeting</Link>
        </div>
      </section>
    </>
  );
}
