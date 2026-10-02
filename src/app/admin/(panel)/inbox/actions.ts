"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { invalidateContent } from "@/lib/cache";
import { slugify } from "@/lib/slug";
import { rotaryYearOf } from "@/lib/rotary-year";
import { fetchText } from "@/lib/ingest/http";
import { parseD9213AlbumImages } from "@/lib/ingest/parsers";
import { can, type Permission } from "@/lib/permissions";

const DEST_PERM: Record<string, Permission> = { stories: "stories", albums: "media", "dg-visits": "dgVisits", family: "family", projects: "projects", none: "inbox" };

async function uniq(model: "story" | "album" | "dGVisit" | "club", base: string) {
  let slug = slugify(base);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (let i = 2; await (db as any)[model].findUnique({ where: { slug }, select: { id: true } }); i++) slug = `${slugify(base)}-${i}`;
  return slug;
}

export async function setEventStatus(id: string, status: "APPROVED" | "REJECTED" | "ARCHIVED") {
  const u = await requireAdmin("events");
  const e = await db.event.update({ where: { id }, data: { status } });
  await audit(u, status === "APPROVED" ? "approve" : "reject", "Event", id, `${status.toLowerCase()}: ${e.title}`);
  invalidateContent();
  revalidatePath("/admin/inbox");
  revalidatePath("/", "layout");
}

export async function bulkEvents(ids: string[], status: "APPROVED" | "REJECTED") {
  const u = await requireAdmin("events");
  await db.event.updateMany({ where: { id: { in: ids }, status: "PENDING_REVIEW" }, data: { status } });
  await audit(u, status === "APPROVED" ? "approve" : "reject", "Event", null, `Bulk ${status.toLowerCase()} ${ids.length} imported events`);
  invalidateContent();
  revalidatePath("/admin/inbox");
}

export async function rejectItem(id: string) {
  const u = await requireAdmin("inbox");
  const it = await db.discoveredItem.update({ where: { id }, data: { status: "REJECTED", reviewedById: u.id, reviewedAt: new Date() } });
  await audit(u, "reject", "DiscoveredItem", id, it.title);
  revalidatePath("/admin/inbox");
}

/** Approve = turn the item into a DRAFT record in its destination and open the editor. Nothing goes public here. */
export async function approveItem(id: string, destination: string) {
  const u = await requireAdmin("inbox");
  const perm = DEST_PERM[destination];
  if (!perm) throw new Error("Unknown destination");
  if (!can(u.role, perm)) redirect(`/admin/inbox?tab=items&denied=${destination}`);
  const it = await db.discoveredItem.findUniqueOrThrow({ where: { id } });
  if (it.status !== "NEW") redirect("/admin/inbox?tab=items");
  let href = "/admin/inbox";
  let ref: string | null = null;
  const prov = { sourceLabel: it.sourceLabel, sourceUrl: it.url, verification: "VERIFIED" as const, createdById: u.id };
  if (destination === "stories") {
    const s = await db.story.create({ data: { slug: await uniq("story", it.title), title: it.title, dek: it.summary?.slice(0, 280) ?? null, body: it.summary ? `${it.summary}\n\n_Rewrite this in the club's own words before publishing. Do not paste long passages from the source._` : null, heroImageUrl: it.imageUrl, publishedAt: it.itemDate, status: "DRAFT", ...prov } });
    ref = `story:${s.id}`; href = `/admin/content/stories/${s.id}`;
  } else if (destination === "albums") {
    const a = await db.album.create({ data: { slug: await uniq("album", it.title), title: it.title, date: it.itemDate, coverUrl: it.imageUrl?.replace("/thumb/", "/"), kind: /dg|governor/i.test(it.title) ? "DG_VISIT" : "EVENT", sourceLabel: it.sourceLabel, sourceUrl: it.url, status: "DRAFT", createdById: u.id } });
    if (it.url && /rotaryd9213\.org\/PhotoAlbums\//i.test(it.url)) {
      try {
        const imgs = parseD9213AlbumImages(await fetchText(it.url));
        await db.media.createMany({ data: imgs.map((url, i) => ({ url, thumbUrl: url.replace("/00000050109/", "/00000050109/thumb/"), albumId: a.id, order: i, credit: "District 9213", sourceUrl: it.url, alt: `Photograph from “${it.title}”` })) });
      } catch (e) { console.error("album import", e); }
    }
    ref = `album:${a.id}`; href = `/admin/content/albums/${a.id}`;
  } else if (destination === "dg-visits") {
    const p = (it.payload ?? {}) as { eventId?: string; venue?: string };
    const date = it.itemDate ?? new Date();
    const v = await db.dGVisit.create({ data: { slug: await uniq("dGVisit", `dg-visit-${date.toISOString().slice(0, 10)}`), governorName: "To be confirmed", rotaryYear: rotaryYearOf(date), date, venue: p.venue ?? null, eventId: p.eventId ?? null, status: "DRAFT", ...prov } });
    ref = `dg:${v.id}`; href = `/admin/content/dg-visits/${v.id}`;
  } else if (destination === "family") {
    const c = await db.club.create({ data: { slug: await uniq("club", it.title), name: it.title.replace(/^"|"$/g, ""), type: /rotaract/i.test(it.title) ? "ROTARACT" : /interact/i.test(it.title) ? "INTERACT" : "ROTARY", description: it.summary, status: "DRAFT", sourceLabel: it.sourceLabel, sourceUrl: it.url, verification: "NEEDS_CONFIRMATION", createdById: u.id } });
    ref = `club:${c.id}`; href = `/admin/content/clubs/${c.id}`;
  } else if (destination === "projects") {
    const pr = await db.project.create({ data: { slug: `${slugify(it.title).slice(0, 60)}-${Date.now().toString(36)}`, title: it.title, summary: it.summary, heroImageUrl: it.imageUrl, status: "DRAFT", partners: [], outcomes: [], ...prov, verification: "NEEDS_CONFIRMATION" } });
    ref = `project:${pr.id}`; href = `/admin/content/projects/${pr.id}`;
  }
  await db.discoveredItem.update({ where: { id }, data: { status: "APPROVED", resultRef: ref, reviewedById: u.id, reviewedAt: new Date() } });
  await audit(u, "approve", "DiscoveredItem", id, `${it.title} → ${destination}`);
  redirect(href);
}
