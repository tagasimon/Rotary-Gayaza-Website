import "server-only";
import { db } from "./db";
import { getFamily, getHomeClub, getDGVisits } from "./queries";
import type { FamilyNode } from "@/components/site/FamilyTree";
import { formatDate } from "./time";

const TYPE_LABEL = { ROTARY: "Rotary club", ROTARACT: "Rotaract club", INTERACT: "Interact club", ROTARY_COMMUNITY_CORPS: "Rotary Community Corps", OTHER: "Organisation" } as const;

/** Builds the Rotary Family network from real records only. */
export async function buildFamilyNodes(): Promise<{ nodes: FamilyNode[]; centre: { title: string; story: string; year?: string } }> {
  const [home, rels, visits, projects] = await Promise.all([
    getHomeClub(),
    getFamily(),
    getDGVisits(),
    db.project.findMany({ where: { status: "PUBLISHED" }, orderBy: [{ featured: "desc" }, { startDate: "desc" }], take: 6 }),
  ]);
  const nodes: FamilyNode[] = [];

  for (const r of rels) {
    if (r.childClubId === home.id) {
      nodes.push({ id: `c-${r.parentClubId}`, label: r.parentClub.name, short: r.parentClub.shortName ?? undefined, group: "roots", kind: TYPE_LABEL[r.parentClub.type],
        relationship: r.relationshipType, year: r.year, story: r.description ?? r.parentClub.description, pending: r.verification !== "VERIFIED" });
    } else if (r.parentClubId === home.id) {
      nodes.push({ id: `c-${r.childClubId}`, label: r.childClub.name, short: r.childClub.shortName ?? undefined, group: "youth", kind: TYPE_LABEL[r.childClub.type],
        relationship: r.relationshipType, year: r.year, story: r.description ?? r.childClub.description, pending: r.verification !== "VERIFIED" });
    }
  }

  for (const p of projects) {
    nodes.push({ id: `p-${p.id}`, label: p.title, short: p.title.length > 26 ? p.title.slice(0, 24).trimEnd() + "…" : p.title, group: "projects", kind: p.impactCategory || "Project",
      year: p.dateLabel, story: p.summary, href: `/projects/${p.slug}`, pending: p.verification !== "VERIFIED" });
  }

  const places = new Map<string, string>();
  for (const p of await db.project.findMany({ where: { status: "PUBLISHED", location: { not: null } }, select: { location: true, slug: true } })) {
    for (const part of (p.location ?? "").split(/,| and /).map((s) => s.trim()).filter(Boolean)) if (!places.has(part)) places.set(part, p.slug);
  }
  for (const [place, slug] of places) nodes.push({ id: `l-${place}`, label: place, group: "communities", kind: "Community served", href: `/projects/${slug}` });

  const partners = [...new Set(projects.flatMap((p) => p.partners))];
  for (const name of partners) nodes.push({ id: `pa-${name}`, label: name, group: "partners", kind: "Partner" });
  nodes.push({ id: "pa-invite", label: "Your organisation", group: "partners", kind: "An open invitation", story: "Businesses, schools, health centres and NGOs that share our communities can partner with the club on projects.", href: "/contact?interest=partner", invite: true });

  const next = visits.find((v) => v.visitStatus === "NEXT" || v.visitStatus === "TODAY");
  if (next) nodes.push({ id: "f-dg", label: `Governor's visit · ${formatDate(next.date, "short")}`, short: "Governor's visit", group: "future", kind: "Upcoming", year: next.rotaryYear, story: next.summary, href: "/district-governor" });
  nodes.push({ id: "f-next-club", label: "The next club", group: "future", kind: "New growth", story: "Every club in this family began as a conversation. The next Interact, Rotaract or Rotary club could start with yours.", href: "/contact?interest=new-club", invite: true });

  const kids = rels.filter((r) => r.parentClubId === home.id).length;
  return {
    nodes,
    centre: {
      title: home.name,
      year: home.charterDateLabel ? `Chartered ${home.charterDateLabel}` : undefined,
      story: `Rooted in the support of ${rels.filter((r) => r.childClubId === home.id).length} neighbouring clubs, Gayaza has in turn helped ${kids} youth club${kids === 1 ? "" : "s"} take root.`,
    },
  };
}
