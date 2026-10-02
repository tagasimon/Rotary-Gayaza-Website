import type { Metadata } from "next";
import Link from "next/link";
import { getProjects, getProjectFacets, type ProjectFilters } from "@/lib/queries";
import { PageHero } from "@/components/site/PageHero";
import { ProjectCard } from "@/components/site/Cards";

export const metadata: Metadata = { title: "Projects", description: "Service projects of the Rotary Club of Gayaza — searchable by year, Rotary year, area of focus, location, type, partner and status.", alternates: { canonical: "/projects" } };

const FILTERS: [keyof ProjectFilters, string][] = [["ry", "Rotary year"], ["year", "Year"], ["focus", "Area of focus"], ["category", "Impact area"], ["location", "Location"], ["type", "Project type"], ["partner", "Partner"], ["status", "Status"]];

export default async function Projects({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const f: ProjectFilters = Object.fromEntries(Object.entries(sp).filter(([, v]) => v)) as ProjectFilters;
  const [projects, facets] = await Promise.all([getProjects(f), getProjectFacets()]);
  const active = Object.keys(f).length > 0;
  return (
    <>
      <PageHero eyebrow="Projects" title="Every project, on the record." intro="Search the club's service work, or filter it by year, area of focus, place or partner." />
      <section className="py-12">
        <div className="wrap">
          <form method="get" className="grid gap-3 border-b border-line pb-8 sm:grid-cols-2 lg:grid-cols-5" role="search" aria-label="Filter projects">
            <label className="lg:col-span-2"><span className="label">Search</span><input name="q" defaultValue={f.q} placeholder="Title, place, summary…" className="field" /></label>
            {FILTERS.map(([k, label]) => {
              const opts = facets[k as keyof typeof facets] as string[] | undefined;
              if (!opts || opts.length === 0) return null;
              return (
                <label key={k}><span className="label">{label}</span>
                  <select name={k} defaultValue={f[k] ?? ""} className="field"><option value="">All</option>{opts.map((o) => <option key={o} value={o}>{o}</option>)}</select>
                </label>
              );
            })}
            <div className="flex items-end gap-2"><button className="btn btn-royal w-full">Apply</button>{active && <Link href="/projects" className="btn btn-line">Clear</Link>}</div>
          </form>
          <p className="mt-6 text-sm text-muted" aria-live="polite">{projects.length} project{projects.length === 1 ? "" : "s"}</p>
          <div className="mt-8 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => <ProjectCard key={p.id} p={p} />)}
          </div>
          {projects.length === 0 && <p className="py-20 text-center text-ink-2">No projects match those filters.</p>}
        </div>
      </section>
    </>
  );
}
