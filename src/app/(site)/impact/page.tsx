import type { Metadata } from "next";
import Link from "next/link";
import { getMetrics, getProjects } from "@/lib/queries";
import { PageHero } from "@/components/site/PageHero";
import { CountUp } from "@/components/site/CountUp";
import { ProjectCard } from "@/components/site/Cards";
import { hostOf } from "@/lib/utils";

export const metadata: Metadata = { title: "Our Impact", description: "Documented impact of the Rotary Club of Gayaza: health outreach, road safety, youth leadership and more — each figure with its source and period.", alternates: { canonical: "/impact" } };

const CATEGORY_ORDER = ["Health", "Water & Sanitation", "Education", "Youth", "Community Development", "Road Safety", "Environment", "Economic Empowerment", "Cancer / Fundraising", "Leadership"];

export default async function Impact() {
  const [metrics, projects] = await Promise.all([getMetrics(false), getProjects()]);
  const categories = CATEGORY_ORDER.filter((c) => projects.some((p) => p.impactCategory === c) || metrics.some((m) => m.category === c));
  const other = [...new Set(projects.map((p) => p.impactCategory).filter((c): c is string => !!c && !CATEGORY_ORDER.includes(c)))];
  return (
    <>
      <PageHero eyebrow="Our impact" title="What was done, and how we know." intro="We only show areas where the club's work is documented. Each number gives the period it covers and links to its source." />
      <section className="border-b border-line py-16">
        <div className="wrap">
          <ul className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((m) => (
              <li key={m.id} className="flex flex-col bg-paper p-6">
                <span className="display text-6xl text-royal"><CountUp display={m.value} to={m.numericValue} /></span>
                <span className="mt-3 text-lg">{m.label}</span>
                <span className="mt-auto pt-5 text-xs text-muted">{m.period} · {m.sourceUrl ? <a className="underline" href={m.sourceUrl} target="_blank" rel="noopener noreferrer">{m.sourceLabel ?? hostOf(m.sourceUrl)} ↗</a> : "Club records"}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <nav aria-label="Impact areas" className="sticky top-[72px] z-30 border-b border-line bg-paper/95 backdrop-blur">
        <ul className="wrap no-scrollbar flex gap-1 overflow-x-auto py-3">
          {[...categories, ...other].map((c) => <li key={c}><a href={`#${c.replace(/\W+/g, "-")}`} className="chip whitespace-nowrap hover:border-royal hover:text-royal">{c}</a></li>)}
        </ul>
      </nav>
      {[...categories, ...other].map((c, i) => {
        const ps = projects.filter((p) => p.impactCategory === c);
        const ms = metrics.filter((m) => m.category === c);
        return (
          <section key={c} id={c.replace(/\W+/g, "-")} className={`scroll-mt-32 py-20 ${i % 2 ? "bg-paper-2" : ""}`}>
            <div className="wrap grid gap-10 md:grid-cols-12">
              <div className="md:col-span-4">
                <p className="eyebrow text-soil">Area {String(i + 1).padStart(2, "0")}</p>
                <h2 className="mt-2 text-5xl">{c}</h2>
                {ms.map((m) => <p key={m.id} className="mt-6 border-t border-line pt-4"><span className="display text-4xl text-royal">{m.value}</span><span className="mt-1 block text-ink-2">{m.label}</span></p>)}
              </div>
              <div className="grid gap-10 sm:grid-cols-2 md:col-span-8">
                {ps.map((p) => (
                  <div key={p.id}>
                    <ProjectCard p={p} />
                    <dl className="mt-4 space-y-2 text-sm">
                      {p.challenge && <div><dt className="eyebrow inline text-muted">The challenge · </dt><dd className="inline">{p.challenge}</dd></div>}
                      {p.action && <div><dt className="eyebrow inline text-muted">The action · </dt><dd className="inline">{p.action}</dd></div>}
                      {p.result && <div><dt className="eyebrow inline text-muted">The result · </dt><dd className="inline">{p.result}</dd></div>}
                    </dl>
                  </div>
                ))}
                {ps.length === 0 && <p className="text-ink-2">Projects for this area are being documented.</p>}
              </div>
            </div>
          </section>
        );
      })}
      <section className="py-16"><div className="wrap"><Link href="/projects" className="link-arrow">Search and filter every project</Link></div></section>
    </>
  );
}
