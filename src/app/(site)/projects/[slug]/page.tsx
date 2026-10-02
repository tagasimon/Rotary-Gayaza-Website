import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/queries";
import { PageHero } from "@/components/site/PageHero";
import { Markdown } from "@/components/site/Markdown";
import { Gallery } from "@/components/site/Gallery";
import { Provenance } from "@/components/site/Provenance";
import { ShareButtons } from "@/components/site/ShareButtons";
import { JsonLd } from "@/components/site/JsonLd";
import { absUrl, excerpt, hostOf } from "@/lib/utils";

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await getProject((await params).slug);
  if (!p) return {};
  return { title: p.title, description: excerpt(p.summary, 160), alternates: { canonical: `/projects/${p.slug}` },
    openGraph: { title: p.title, description: excerpt(p.summary, 160), images: p.heroImageUrl ? [p.heroImageUrl] : undefined, type: "article" } };
}

export default async function ProjectPage({ params }: P) {
  const p = await getProject((await params).slug);
  if (!p) notFound();
  const blocks: [string, string | null][] = [["The challenge", p.challenge], ["The action", p.action], ["The people", p.people], ["The result", p.result]];
  return (
    <article>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: p.title, description: p.summary, image: p.heroImageUrl ? [absUrl(p.heroImageUrl)] : undefined,
        datePublished: (p.startDate ?? p.createdAt).toISOString(), author: { "@type": "Organization", name: "Rotary Club of Gayaza" }, mainEntityOfPage: absUrl(`/projects/${p.slug}`) }} />
      <PageHero eyebrow={["Project", p.impactCategory, p.dateLabel].filter(Boolean).join(" · ")} title={p.title} intro={p.summary} image={p.heroImageUrl} />
      <div className="wrap grid gap-12 py-16 md:grid-cols-12 sm:py-24">
        <aside className="md:col-span-4 md:order-2">
          <dl className="sticky top-24 space-y-5 border-t-2 border-ink pt-5 text-sm">
            {([["When", p.dateLabel], ["Rotary year", p.rotaryYear], ["Where", p.location], ["Area of focus", p.areaOfFocus], ["Project type", p.projectType], ["Status", p.projectStatus],
              ["People reached", p.peopleReached], ["Participants", p.participants], ["Funding", p.fundingSource], ["Budget", p.budget]] as const).filter(([, v]) => v).map(([k, v]) => (
              <div key={k}><dt className="eyebrow text-muted">{k}</dt><dd className="mt-1 text-base font-semibold">{v}</dd></div>
            ))}
            {p.partners.length > 0 && <div><dt className="eyebrow text-muted">Partners</dt><dd className="mt-1">{p.partners.join(", ")}</dd></div>}
            <Provenance label={p.sourceLabel} url={p.sourceUrl} verification={p.verification} />
          </dl>
        </aside>
        <div className="md:col-span-7 md:order-1">
          <div className="space-y-10">
            {blocks.filter(([, v]) => v).map(([k, v], i) => (
              <section key={k} className="grid gap-2 sm:grid-cols-[120px_1fr]">
                <h2 className="eyebrow pt-1.5 text-soil">{String(i + 1).padStart(2, "0")} · {k}</h2>
                <p className="text-xl leading-relaxed text-ink">{v}</p>
              </section>
            ))}
          </div>
          {p.outcomes.length > 0 && (
            <section className="mt-12 bg-royal p-8 text-white">
              <h2 className="eyebrow text-gold">Measured outcomes</h2>
              <ul className="mt-4 space-y-2">{p.outcomes.map((o) => <li key={o} className="display text-2xl">{o}</li>)}</ul>
            </section>
          )}
          {p.story && <section className="mt-14"><h2 className="eyebrow mb-4 text-soil">The story</h2><Markdown>{p.story}</Markdown></section>}
          {(p.videoUrls.length > 0 || p.documentUrls.length > 0 || p.externalLinks.length > 0) && (
            <section className="mt-12 border-t border-line pt-6">
              <h2 className="eyebrow text-soil">Evidence & links</h2>
              <ul className="mt-3 space-y-2">
                {[...p.videoUrls.map((u) => ["Video", u]), ...p.documentUrls.map((u) => ["Document", u]), ...p.externalLinks.map((u) => ["Link", u])].map(([k, u]) => (
                  <li key={u}><a href={u} target="_blank" rel="noopener noreferrer" className="link-arrow">{k}: {hostOf(u) || u}</a></li>
                ))}
              </ul>
            </section>
          )}
          {p.stories.length > 0 && (
            <section className="mt-12"><h2 className="eyebrow text-soil">Related stories</h2>
              <ul className="mt-3 space-y-2">{p.stories.map((s) => <li key={s.id}><Link href={`/stories/${s.slug}`} className="display text-2xl hover:text-royal">{s.title}</Link></li>)}</ul>
            </section>
          )}
          <div className="mt-12"><ShareButtons url={absUrl(`/projects/${p.slug}`)} title={p.title} /></div>
        </div>
      </div>
      {p.album && p.album.media.length > 0 && (
        <section className="border-t border-line bg-paper-2 py-16">
          <div className="wrap">
            <div className="mb-6 flex items-end justify-between"><h2 className="text-3xl">Photographs</h2><Link href={`/gallery/${p.album.slug}`} className="link-arrow">Full album</Link></div>
            <Gallery photos={p.album.media} />
          </div>
        </section>
      )}
      <div className="wrap py-10"><Link href="/projects" className="link-arrow">All projects</Link></div>
    </article>
  );
}
