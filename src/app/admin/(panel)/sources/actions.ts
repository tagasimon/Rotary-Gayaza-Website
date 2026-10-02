"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { runIngestion } from "@/lib/ingest/run";
import { fetchText } from "@/lib/ingest/http";
import { parseGenericPage } from "@/lib/ingest/parsers";
import { createHash } from "node:crypto";
import type { DiscoveredType } from "@prisma/client";

export async function runNow(key?: string) {
  const u = await requireAdmin("sources");
  const r = await runIngestion("manual", key);
  await audit(u, "ingest", "EventSource", key ?? null, `Manual discovery run${key ? ` (${key})` : ""}`);
  revalidatePath("/admin/sources");
  revalidatePath("/admin/inbox");
  return r;
}

export async function updateSource(id: string, form: FormData) {
  const u = await requireAdmin("sources");
  const s = await db.eventSource.update({ where: { id }, data: { enabled: form.get("enabled") === "on", keywords: String(form.get("keywords") ?? "").split(",").map((k) => k.trim()).filter(Boolean) } });
  await audit(u, "update", "EventSource", id, `${s.name}: enabled=${s.enabled}, keywords=${s.keywords.join(",")}`);
  revalidatePath("/admin/sources");
}

export type ImportState = { ok?: boolean; error?: string; note?: string };

/** "Import from source": for pages that cannot be imported automatically (X posts, PDFs, one-off articles). */
export async function importFromUrl(_: ImportState, form: FormData): Promise<ImportState> {
  const u = await requireAdmin("inbox");
  const url = String(form.get("url") ?? "").trim();
  if (!/^https?:\/\//.test(url)) return { error: "Paste a full link starting with https://" };
  const TYPES = ["EVENT", "STORY", "PHOTO_ALBUM", "DG_VISIT", "CLUB", "CLUB_MENTION", "OTHER"] as const;
  const rawType = String(form.get("type") ?? "OTHER");
  const type = (TYPES as readonly string[]).includes(rawType) ? (rawType as DiscoveredType) : "OTHER";
  const rawScope = String(form.get("scope") ?? "COMMUNITY");
  const scope = (["CLUB", "DISTRICT", "COMMUNITY"].includes(rawScope) ? rawScope : "COMMUNITY") as "CLUB" | "DISTRICT" | "COMMUNITY";
  const rawDate = String(form.get("date") ?? "");
  if (rawDate && !/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) return { error: "Invalid date." };
  const dest = { EVENT: "events", STORY: "stories", PHOTO_ALBUM: "albums", DG_VISIT: "dg-visits", CLUB: "family", CLUB_MENTION: "stories", OTHER: "stories" }[type];
  let title = String(form.get("title") ?? "").trim();
  let summary = String(form.get("summary") ?? "").trim() || null;
  let image: string | null = null, itemDate: Date | null = rawDate ? new Date(`${rawDate}T12:00:00+03:00`) : null;
  let note: string | undefined;
  const host = new URL(url).hostname;
  if (/(^|\.)x\.com$|(^|\.)twitter\.com$/.test(host)) {
    note = "X posts can't be read automatically, so the title and summary you entered were saved.";
  } else {
    try {
      const meta = parseGenericPage(await fetchText(url), url);
      title ||= meta.title; summary ||= meta.description; image = meta.image; itemDate ??= [meta.startDate, meta.published].find((d) => d && !isNaN(+d)) ?? null;
    } catch (e) { note = `Couldn't read the page (${(e as Error).message}); saved with what you entered.`; }
  }
  if (!title) return { error: "Please add a title — the page couldn't be read automatically." };
  const dedupeKey = "url:" + createHash("sha1").update(url.toLowerCase()).digest("hex");
  if (await db.discoveredItem.findUnique({ where: { dedupeKey } })) return { error: "That link is already in the inbox." };
  if (type === "EVENT") {
    if (!itemDate) return { error: "Add the event date — it couldn't be detected." };
    const { slugify, normalizeTitle } = await import("@/lib/slug");
    const ev = await db.event.create({ data: { slug: `${slugify(title).slice(0, 60)}-${Date.now().toString(36)}`, title, description: summary, startsAt: itemDate, timeTbc: true, scope, type: "CLUB_EVENT", imageUrl: image, status: "PENDING_REVIEW", sourceLabel: host.replace(/^www\./, ""), sourceUrl: url, dedupeKey: `${normalizeTitle(title)}|${itemDate.toISOString().slice(0, 10)}`, importedAt: new Date(), lastCheckedAt: new Date(), createdById: u.id } });
    await audit(u, "import", "Event", ev.id, `Imported from ${url}`);
  } else {
    await db.discoveredItem.create({ data: { sourceKey: "url-import", sourceLabel: host.replace(/^www\./, ""), type, title, url, summary, imageUrl: image, itemDate, suggestedDestination: dest, dedupeKey } });
    await audit(u, "import", "DiscoveredItem", null, `Imported from ${url}`);
  }
  revalidatePath("/admin/inbox");
  return { ok: true, note };
}
