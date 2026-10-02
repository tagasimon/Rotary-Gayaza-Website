import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL();
  const statics = ["", "/our-story", "/impact", "/projects", "/rotary-family", "/events", "/district-governor", "/leadership", "/members", "/stories", "/gallery", "/contact"]
    .map((p) => ({ url: base + p, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 }));
  const [projects, stories, events, albums] = await Promise.all([
    db.project.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    db.story.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    db.event.findMany({ where: { status: "APPROVED" }, select: { slug: true, updatedAt: true } }),
    db.album.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
  ]);
  return [
    ...statics,
    ...projects.map((x) => ({ url: `${base}/projects/${x.slug}`, lastModified: x.updatedAt })),
    ...stories.map((x) => ({ url: `${base}/stories/${x.slug}`, lastModified: x.updatedAt })),
    ...events.map((x) => ({ url: `${base}/events/${x.slug}`, lastModified: x.updatedAt })),
    ...albums.map((x) => ({ url: `${base}/gallery/${x.slug}`, lastModified: x.updatedAt })),
  ];
}
