import "server-only";
import type { Prisma, EventScope } from "@prisma/client";
import { db } from "./db";
import { cached } from "./cache";
import { visitStatuses } from "./dg";
import { localParts } from "./time";

const PUB = "PUBLISHED" as const;

export const getHomeClub = () =>
  cached("club", async () => {
    const c = await db.club.findFirst({ where: { isHome: true } });
    if (!c) throw new Error("Home club missing — run the seed (npm run db:seed).");
    return c;
  });

export const getSections = (prefix: string) =>
  cached(`sections:${prefix}`, async () => {
    const rows = await db.siteSection.findMany({ where: { key: { startsWith: prefix }, status: PUB }, orderBy: { order: "asc" } });
    return Object.fromEntries(rows.map((r) => [r.key, r])) as Record<string, (typeof rows)[number] | undefined>;
  });

export const getStoryChapters = () =>
  cached("chapters", () => db.siteSection.findMany({ where: { key: { startsWith: "story." }, status: PUB }, orderBy: { order: "asc" } }));

export const getMetrics = (featuredOnly = true) =>
  cached(`metrics:${featuredOnly}`, () =>
    db.impactMetric.findMany({ where: { status: PUB, ...(featuredOnly ? { featured: true } : {}) }, orderBy: { order: "asc" } }));

export type ProjectFilters = { q?: string; year?: string; ry?: string; focus?: string; category?: string; location?: string; type?: string; partner?: string; status?: string };

export async function getProjects(f: ProjectFilters = {}) {
  const where: Prisma.ProjectWhereInput = { status: PUB };
  if (f.q) where.OR = [{ title: { contains: f.q, mode: "insensitive" } }, { summary: { contains: f.q, mode: "insensitive" } }, { location: { contains: f.q, mode: "insensitive" } }];
  if (f.ry) where.rotaryYear = f.ry;
  if (f.year) where.startDate = { gte: new Date(`${f.year}-01-01T00:00:00+03:00`), lt: new Date(`${+f.year + 1}-01-01T00:00:00+03:00`) };
  if (f.focus) where.areaOfFocus = f.focus;
  if (f.category) where.impactCategory = f.category;
  if (f.location) where.location = { contains: f.location, mode: "insensitive" };
  if (f.type) where.projectType = f.type;
  if (f.partner) where.partners = { has: f.partner };
  if (f.status) where.projectStatus = f.status;
  return db.project.findMany({ where, orderBy: [{ featured: "desc" }, { startDate: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }] });
}

export const getProjectFacets = () =>
  cached("project-facets", async () => {
    const rows = await db.project.findMany({ where: { status: PUB }, select: { rotaryYear: true, startDate: true, areaOfFocus: true, impactCategory: true, location: true, projectType: true, partners: true, projectStatus: true } });
    const uniq = (xs: (string | null | undefined)[]) => [...new Set(xs.filter(Boolean) as string[])].sort();
    return {
      ry: uniq(rows.map((r) => r.rotaryYear)).reverse(),
      year: uniq(rows.map((r) => (r.startDate ? String(r.startDate.getUTCFullYear()) : null))).reverse(),
      focus: uniq(rows.map((r) => r.areaOfFocus)),
      category: uniq(rows.map((r) => r.impactCategory)),
      location: uniq(rows.map((r) => r.location)),
      type: uniq(rows.map((r) => r.projectType)),
      partner: uniq(rows.flatMap((r) => r.partners)),
      status: uniq(rows.map((r) => r.projectStatus)),
    };
  });

export const getProject = (slug: string) =>
  db.project.findFirst({ where: { slug, status: PUB }, include: { album: { include: { media: { orderBy: { order: "asc" }, take: 24 } } }, stories: { where: { status: PUB } } } });

export const getStories = (take = 50) =>
  cached(`stories:${take}`, () => db.story.findMany({ where: { status: PUB }, orderBy: [{ publishedAt: { sort: "desc", nulls: "last" } }], take, include: { project: { select: { title: true, slug: true } } } }));

export const getStory = (slug: string) =>
  db.story.findFirst({ where: { slug, status: PUB }, include: { project: true, album: { include: { media: { orderBy: { order: "asc" }, take: 24 } } } } });

export const getTimeline = () =>
  cached("timeline", () => db.timelineEntry.findMany({ where: { status: PUB }, orderBy: { date: "asc" } }));

export const getFamily = () =>
  cached("family", async () => {
    const rels = await db.clubRelationship.findMany({ where: { status: PUB }, include: { parentClub: true, childClub: true }, orderBy: { order: "asc" } });
    return rels.filter((r) => r.parentClub.status === PUB && r.childClub.status === PUB);
  });

export async function getEvents(scope?: EventScope, opts: { upcoming?: boolean; take?: number } = {}) {
  const now = new Date();
  const startOfToday = new Date(now.getTime() - 12 * 3600e3);
  return db.event.findMany({
    where: { status: "APPROVED", ...(scope ? { scope } : {}), ...(opts.upcoming !== false ? { startsAt: { gte: startOfToday } } : { startsAt: { lt: startOfToday } }) },
    orderBy: { startsAt: opts.upcoming === false ? "desc" : "asc" },
    take: opts.take ?? 30,
  });
}

export const getEvent = (slug: string) => db.event.findFirst({ where: { slug, status: "APPROVED" }, include: { dgVisits: true } });

export const getDGVisits = () =>
  cached("dg-visits", async () => {
    const visits = await db.dGVisit.findMany({ where: { status: PUB }, orderBy: { date: "desc" }, include: { album: { include: { media: { orderBy: { order: "asc" }, take: 12 } } } } });
    const st = visitStatuses(visits);
    return visits.map((v) => ({ ...v, visitStatus: st.get(v.id)! }));
  }, 30_000);

/** The single most important upcoming thing for the homepage: the next DG visit, else the next featured club event. */
export async function getNextBigThing() {
  const visits = await getDGVisits();
  const v = visits.find((x) => x.visitStatus === "TODAY") ?? visits.find((x) => x.visitStatus === "NEXT");
  if (v) return { kind: "dg" as const, title: `District Governor ${v.governorName}'s visit`, date: v.date, timeLabel: v.timeLabel, venue: v.venue, href: "/district-governor", status: v.visitStatus, sourceUrl: v.sourceUrl };
  const e = await db.event.findFirst({ where: { status: "APPROVED", scope: "CLUB", startsAt: { gte: new Date() } }, orderBy: [{ featured: "desc" }, { startsAt: "asc" }] });
  if (e) return { kind: "event" as const, title: e.title, date: e.startsAt, timeLabel: null, venue: e.venue, href: `/events/${e.slug}`, status: "UPCOMING" as const, sourceUrl: e.sourceUrl };
  return null;
}

export const getPresidents = () =>
  cached("presidents", () => db.president.findMany({ where: { status: PUB }, orderBy: [{ rotaryYear: "desc" }] }));

export const getLeadership = () =>
  cached("leadership", () =>
    db.member.findMany({ where: { showOnLeadership: true, publicProfile: true, status: { in: ["ACTIVE", "HONORARY"] } }, orderBy: [{ roleOrder: "asc" }, { fullName: "asc" }] }));

export const getPublicMembers = () =>
  cached("public-members", () =>
    db.member.findMany({ where: { publicProfile: true, status: { in: ["ACTIVE", "HONORARY"] } }, orderBy: [{ roleOrder: "asc" }, { fullName: "asc" }],
      select: { id: true, fullName: true, photoUrl: true, rotaryRole: true, bio: true, email: true, phone: true, showContactPublic: true, sourceUrl: true } }));

export const getAlbums = () =>
  cached("albums", () => db.album.findMany({ where: { status: PUB }, orderBy: { date: { sort: "desc", nulls: "last" } }, include: { _count: { select: { media: true } } } }));

export async function getAlbum(slug: string, page = 1, perPage = 24) {
  const album = await db.album.findFirst({ where: { slug, status: PUB } });
  if (!album) return null;
  const [media, total] = await Promise.all([
    db.media.findMany({ where: { albumId: album.id, status: PUB }, orderBy: { order: "asc" }, skip: (page - 1) * perPage, take: perPage }),
    db.media.count({ where: { albumId: album.id, status: PUB } }),
  ]);
  return { album, media, total, page, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export const getMapPoints = () =>
  cached("map", async () => {
    const [club, projects, events] = await Promise.all([
      getHomeClub(),
      db.project.findMany({ where: { status: PUB, latitude: { not: null }, longitude: { not: null } }, select: { title: true, slug: true, latitude: true, longitude: true, location: true } }),
      db.event.findMany({ where: { status: "APPROVED", startsAt: { gte: new Date() }, latitude: { not: null }, longitude: { not: null } }, select: { title: true, slug: true, latitude: true, longitude: true, venue: true, startsAt: true } }),
    ]);
    const pts: { kind: "club" | "project" | "event"; title: string; subtitle?: string; href?: string; lat: number; lng: number }[] = [];
    if (club.latitude && club.longitude) pts.push({ kind: "club", title: "Weekly meeting", subtitle: `${club.venue} · ${club.meetingDay}s ${club.meetingTime}`, lat: club.latitude, lng: club.longitude });
    for (const p of projects) pts.push({ kind: "project", title: p.title, subtitle: p.location ?? undefined, href: `/projects/${p.slug}`, lat: p.latitude!, lng: p.longitude! });
    for (const e of events) pts.push({ kind: "event", title: e.title, subtitle: e.venue ?? undefined, href: `/events/${e.slug}`, lat: e.latitude!, lng: e.longitude! });
    return pts;
  });

export const getSponsors = () =>
  cached("sponsors", () => db.sponsor.findMany({ where: { status: PUB }, orderBy: [{ order: "asc" }, { name: "asc" }] }));

export const getPress = () =>
  cached("press", () => db.pressMention.findMany({ where: { status: PUB }, orderBy: [{ date: { sort: "desc", nulls: "last" } }, { order: "asc" }] }));

/**
 * Fellowship is every Sunday. Returns the next one (today, if it's Sunday and not yet over),
 * enriched with any approved club event the club has published for that Sunday.
 */
export async function getNextFellowship() {
  const club = await getHomeClub();
  const now = new Date();
  const p = localParts(now);
  const dow = new Date(`${p.ymd}T12:00:00+03:00`).getUTCDay();
  let add = (7 - dow) % 7;
  if (add === 0 && p.hh >= 20) add = 7;
  const day = new Date(new Date(`${p.ymd}T00:00:00+03:00`).getTime() + add * 864e5);
  const dayEnd = new Date(day.getTime() + 864e5);
  const event = await db.event.findFirst({
    where: { status: "APPROVED", scope: "CLUB", startsAt: { gte: day, lt: dayEnd } },
    orderBy: [{ featured: "desc" }, { startsAt: "asc" }],
  });
  const [hh, mm] = (() => { const m = (club.meetingTime ?? "5:00 PM").match(/(\d{1,2}):(\d{2})\s*([AP])M/i); if (!m) return [17, 0]; let h = +m[1] % 12; if (m[3].toUpperCase() === "P") h += 12; return [h, +m[2]]; })();
  const ymd = localParts(day).ymd;
  const startsAt = event?.startsAt ?? new Date(`${ymd}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00+03:00`);
  return { date: day, startsAt, venue: event?.venue ?? club.venue, event };
}
