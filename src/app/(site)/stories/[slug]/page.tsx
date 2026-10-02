import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStory, getStories } from "@/lib/queries";
import { Img } from "@/components/site/Img";
import { Markdown } from "@/components/site/Markdown";
import { Gallery } from "@/components/site/Gallery";
import { ShareButtons } from "@/components/site/ShareButtons";
import { StoryCard } from "@/components/site/Cards";
import { JsonLd } from "@/components/site/JsonLd";
import { formatDate } from "@/lib/time";
import { absUrl, excerpt, hostOf } from "@/lib/utils";

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const s = await getStory((await params).slug);
  if (!s) return {};
  return { title: s.title, description: s.dek ?? excerpt(s.body, 160), alternates: { canonical: `/stories/${s.slug}` },
    openGraph: { type: "article", title: s.title, description: s.dek ?? undefined, images: s.heroImageUrl ? [s.heroImageUrl] : undefined, publishedTime: s.publishedAt?.toISOString() } };
}

export default async function StoryPage({ params }: P) {
  const s = await getStory((await params).slug);
  if (!s) notFound();
  const related = (await getStories(8)).filter((x) => x.id !== s.id).slice(0, 3);
  return (
    <article>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "NewsArticle", headline: s.title, description: s.dek, image: s.heroImageUrl ? [absUrl(s.heroImageUrl)] : undefined,
        datePublished: s.publishedAt?.toISOString(), dateModified: s.updatedAt.toISOString(), author: { "@type": "Organization", name: "Rotary Club of Gayaza" },
        publisher: { "@type": "Organization", name: "Rotary Club of Gayaza" }, mainEntityOfPage: absUrl(`/stories/${s.slug}`), isBasedOn: s.sourceUrl ?? undefined }} />
      <header className="wrap pb-10 pt-16 sm:pt-24">
        <p className="eyebrow text-soil">{["Story", s.place, s.publishedAt ? formatDate(s.publishedAt) : null].filter(Boolean).join(" · ")}</p>
        <h1 className="mt-5 max-w-5xl text-5xl leading-[1] sm:text-7xl">{s.title}</h1>
        {s.dek && <p className="lede mt-6 max-w-3xl">{s.dek}</p>}
      </header>
      {s.heroImageUrl && <div className="relative mx-auto aspect-[21/10] max-w-[1600px] overflow-hidden bg-paper-2"><Img src={s.heroImageUrl} alt="" fill priority sizes="100vw" className="object-cover" /></div>}
      <div className="wrap grid gap-12 py-16 md:grid-cols-12">
        <aside className="space-y-5 text-sm md:col-span-3">
          {s.impact && <div className="border-t-2 border-ink pt-3"><p className="eyebrow text-muted">Impact</p><p className="display mt-1 text-xl">{s.impact}</p></div>}
          {s.people.length > 0 && <div><p className="eyebrow text-muted">People</p><p className="mt-1">{s.people.join(", ")}</p></div>}
          {s.place && <div><p className="eyebrow text-muted">Place</p><p className="mt-1">{s.place}</p></div>}
          {s.project && <div><p className="eyebrow text-muted">Project</p><Link href={`/projects/${s.project.slug}`} className="mt-1 block underline">{s.project.title}</Link></div>}
        </aside>
        <div className="md:col-span-7">
          <Markdown>{s.body}</Markdown>
          {s.sourceUrl && (
            <p className="mt-10 border-t border-line pt-4 text-sm text-muted"><span className="eyebrow">Source</span> · This story is based on <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">{s.sourceLabel ?? hostOf(s.sourceUrl)} ↗</a></p>
          )}
          <div className="mt-8"><ShareButtons url={absUrl(`/stories/${s.slug}`)} title={s.title} /></div>
        </div>
      </div>
      {s.album && s.album.media.length > 0 && (
        <section className="border-t border-line bg-paper-2 py-16"><div className="wrap"><div className="mb-6 flex items-end justify-between"><h2 className="text-3xl">Photographs</h2><Link href={`/gallery/${s.album.slug}`} className="link-arrow">Full album</Link></div><Gallery photos={s.album.media.slice(0, 12)} /></div></section>
      )}
      {related.length > 0 && (
        <section className="py-16"><div className="wrap"><h2 className="eyebrow mb-8 text-soil">More stories</h2><div className="grid gap-10 md:grid-cols-3">{related.map((r) => <StoryCard key={r.id} s={r} />)}</div></div></section>
      )}
    </article>
  );
}
