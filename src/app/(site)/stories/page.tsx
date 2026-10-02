import type { Metadata } from "next";
import { getStories } from "@/lib/queries";
import { PageHero } from "@/components/site/PageHero";
import { StoryCard } from "@/components/site/Cards";
import { Reveal } from "@/components/site/Reveal";

export const metadata: Metadata = { title: "Stories of Service", description: "Stories of service from the Rotary Club of Gayaza — people, places and the difference made.", alternates: { canonical: "/stories" } };

export default async function Stories() {
  const stories = await getStories(60);
  const [lead, ...rest] = stories;
  return (
    <>
      <PageHero eyebrow="Stories of service" title="Told by the people who were there." />
      <section className="py-16">
        <div className="wrap">
          {lead && <Reveal className="mb-20"><StoryCard s={lead} size="lg" /></Reveal>}
          <div className="grid gap-x-10 gap-y-16 md:grid-cols-2 lg:grid-cols-3">{rest.map((s) => <Reveal key={s.id}><StoryCard s={s} /></Reveal>)}</div>
          {stories.length === 0 && <p className="text-ink-2">Stories are on their way.</p>}
        </div>
      </section>
    </>
  );
}
