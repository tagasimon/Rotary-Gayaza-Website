import type { EventSource, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { fetchText } from "./http";
import { parseIcs, parseD9213Home, parseD9213Stories, parseD9213Albums, parseRotaryO, type ParsedEvent, type ParsedItem } from "./parsers";
import { normalizeTitle, slugify } from "@/lib/slug";
import { localParts, toLocalInput } from "@/lib/time";
import { invalidateContent } from "@/lib/cache";

/**
 * Content discovery. NOTHING is published automatically:
 *  - events are created with status PENDING_REVIEW (only APPROVED events are public);
 *  - stories, albums, DG-visit hints and mentions land in the "Discovered online" inbox.
 * Dedupe: (source, externalId) first, then normalized title + local date (+ venue).
 */
const HORIZON_DAYS = Number(process.env.INGEST_HORIZON_DAYS || 120);
const HOME_KEYWORDS = (process.env.CLUB_KEYWORDS || "gayaza").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const mentionsClub = (s: string) => HOME_KEYWORDS.some((k) => s.toLowerCase().includes(k));
const keywordsMatch = (src: EventSource, s: string) => !src.keywords.length || src.keywords.some((k) => s.toLowerCase().includes(k.toLowerCase()));

type Result = { source: string; found: number; created: number; updated: number; skipped: number; error?: string };

async function uniqueEventSlug(title: string, d: Date) {
  const base = `${slugify(title).slice(0, 60)}-${toLocalInput(d, true)}`;
  let slug = base;
  for (let i = 2; await db.event.findUnique({ where: { slug }, select: { id: true } }); i++) slug = `${base}-${i}`;
  return slug;
}

async function upsertEvent(src: EventSource, e: ParsedEvent, scope: "CLUB" | "DISTRICT" | "COMMUNITY", r: Result) {
  const now = new Date();
  const dedupeKey = `${normalizeTitle(e.title)}|${toLocalInput(e.startsAt, true)}`;
  const existing = await db.event.findFirst({ where: { OR: [{ sourceId: src.id, externalId: e.externalId }, { dedupeKey }] } });
  if (existing) {
    // keep the record fresh while it is still awaiting review; never touch approved/edited content
    const patch: Prisma.EventUpdateInput = { lastCheckedAt: now };
    if (existing.status === "PENDING_REVIEW" && existing.sourceId === src.id) Object.assign(patch, { title: e.title, startsAt: e.startsAt, endsAt: e.endsAt ?? null, venue: e.venue ?? existing.venue });
    await db.event.update({ where: { id: existing.id }, data: patch });
    r.updated++;
    return existing;
  }
  const isDG = /\bDG'?s?\b.*visit|governor'?s?\s+visit/i.test(e.title);
  const lp = localParts(e.startsAt);
  const ev = await db.event.create({
    data: {
      slug: await uniqueEventSlug(e.title, e.startsAt), title: e.title, description: e.description ?? null,
      type: isDG ? "DG_VISIT" : scope === "COMMUNITY" ? "FELLOWSHIP" : "DISTRICT_EVENT", scope,
      startsAt: e.startsAt, endsAt: e.endsAt ?? null, timeTbc: !!e.timeTbc, allDay: lp.hh === 0 && lp.mm === 0 && !e.timeTbc,
      venue: e.venue ?? null, organiser: e.organiser ?? (scope === "DISTRICT" ? "Rotary District 9213" : null), imageUrl: e.imageUrl ?? null,
      status: "PENDING_REVIEW", sourceId: src.id, sourceLabel: src.name.split(" — ")[0], sourceUrl: e.url ?? src.url, externalId: e.externalId, dedupeKey, importedAt: now, lastCheckedAt: now,
    },
  });
  r.created++;
  return ev;
}

async function upsertDiscovered(data: Prisma.DiscoveredItemCreateInput, r: Result) {
  const existing = await db.discoveredItem.findUnique({ where: { dedupeKey: data.dedupeKey } });
  if (existing) { await db.discoveredItem.update({ where: { id: existing.id }, data: { lastSeenAt: new Date() } }); r.updated++; return; }
  await db.discoveredItem.create({ data });
  r.created++;
}

export async function runSource(src: EventSource): Promise<Result> {
  const r: Result = { source: src.key, found: 0, created: 0, updated: 0, skipped: 0 };
  const now = new Date();
  const horizon = new Date(now.getTime() + HORIZON_DAYS * 864e5);
  const inWindow = (d: Date) => d >= new Date(now.getTime() - 864e5) && d <= horizon;
  try {
    switch (src.kind) {
      case "D9213_ICAL": {
        const all = parseIcs(await fetchText(src.url)).filter((e) => inWindow(e.startsAt) && keywordsMatch(src, `${e.title} ${e.venue ?? ""}`));
        r.found = all.length;
        // the district calendar lists the Governor's visit to every club — keep only ours
        const events = all.filter((e) => !(/\bDG'?s?\b.*visit|governor'?s?\s+visit/i.test(e.title) && !mentionsClub(e.title)));
        r.skipped += all.length - events.length;
        for (const e of events) await upsertEvent(src, { ...e, url: e.url ?? "https://rotaryd9213.org/" }, mentionsClub(e.title) && !/rac\b|rotaract/i.test(e.title) ? "CLUB" : "DISTRICT", r);
        break;
      }
      case "D9213_HOME_EVENTS": {
        // The homepage list carries DG visits to every club; keep ours and genuine district-wide events only.
        const events = parseD9213Home(await fetchText(src.url)).filter((e) => inWindow(e.startsAt));
        r.found = events.length;
        for (const e of events) {
          const otherClubsDG = /\bDG'?s?\b.*visit/i.test(e.title) && !mentionsClub(e.title);
          if (otherClubsDG || !keywordsMatch(src, e.title)) { r.skipped++; continue; }
          const ours = mentionsClub(e.title);
          const ev = await upsertEvent(src, e, ours ? "CLUB" : "DISTRICT", r);
          if (ours && /\bDG'?s?\b.*visit/i.test(e.title)) {
            const near = await db.dGVisit.findFirst({ where: { date: { gte: new Date(e.startsAt.getTime() - 3 * 864e5), lte: new Date(e.startsAt.getTime() + 3 * 864e5) } } });
            if (!near) await upsertDiscovered({ sourceKey: src.key, sourceLabel: "District 9213", type: "DG_VISIT", title: e.title, url: e.url, itemDate: e.startsAt, summary: `District calendar lists a Governor's visit on this date${e.venue ? ` at ${e.venue}` : ""}. Approve to add it to the Governor's Visits archive.`, suggestedDestination: "dg-visits", payload: { eventId: ev.id, venue: e.venue }, dedupeKey: `dg:${e.externalId}` }, r);
          }
        }
        break;
      }
      case "D9213_STORIES": {
        const items = parseD9213Stories(await fetchText(src.url)).filter((s) => keywordsMatch(src, `${s.title} ${s.summary ?? ""}`));
        r.found = items.length;
        for (const s of items) {
          if (await db.story.findFirst({ where: { sourceUrl: { equals: s.url, mode: "insensitive" } } })) { r.skipped++; continue; }
          await upsertDiscovered(item(src, s, "STORY", "stories"), r);
        }
        break;
      }
      case "D9213_ALBUMS": {
        const items = parseD9213Albums(await fetchText(src.url)).filter((s) => keywordsMatch(src, `${s.title} ${s.summary ?? ""}`));
        r.found = items.length;
        for (const s of items) {
          const known = await db.album.findFirst({ where: { sourceUrl: { equals: s.url, mode: "insensitive" } } });
          if (known) { r.skipped++; continue; }
          await upsertDiscovered(item(src, s, "PHOTO_ALBUM", "albums"), r);
        }
        break;
      }
      case "ROTARYO_FELLOWSHIPS": {
        const events = parseRotaryO(await fetchText(src.url)).filter((e) => inWindow(e.startsAt) && keywordsMatch(src, `${e.title} ${e.organiser ?? ""}`));
        r.found = events.length;
        for (const e of events) await upsertEvent(src, e, "COMMUNITY", r);
        break;
      }
      default:
        r.skipped++;
    }
  } catch (e) {
    r.error = (e as Error).message;
  }
  await db.eventSource.update({ where: { id: src.id }, data: { lastRunAt: new Date(), lastStatus: r.error ? "error" : "ok", lastError: r.error ?? null, lastFound: r.found, lastCreated: r.created } });
  return r;
}

function item(src: EventSource, s: ParsedItem, type: "STORY" | "PHOTO_ALBUM", dest: string): Prisma.DiscoveredItemCreateInput {
  return { sourceKey: src.key, sourceLabel: "District 9213", type, title: s.title, url: s.url, itemDate: s.date ?? null, summary: s.summary ?? null, imageUrl: s.imageUrl ?? null, suggestedDestination: dest, dedupeKey: `${src.key}:${s.externalId.toLowerCase()}` };
}

let running = false;
export async function runIngestion(trigger: "schedule" | "manual" | "cron-endpoint" | "cli", onlyKey?: string) {
  if (running) return { skipped: true as const };
  running = true;
  const run = await db.ingestionRun.create({ data: { trigger } });
  try {
    const sources = await db.eventSource.findMany({ where: { enabled: true, ...(onlyKey ? { key: onlyKey } : {}) } });
    const results: Result[] = [];
    for (const s of sources) {
      results.push(await runSource(s));
      await new Promise((res) => setTimeout(res, 1500)); // be gentle between requests
    }
    const ok = results.every((x) => !x.error);
    await db.ingestionRun.update({ where: { id: run.id }, data: { finishedAt: new Date(), ok, summary: results as unknown as Prisma.InputJsonValue } });
    invalidateContent();
    return { results, ok };
  } finally {
    running = false;
  }
}
