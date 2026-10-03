/**
 * Seed — Rotary Club of Gayaza
 *
 * Rules followed here (see README "Content provenance"):
 *  - Only facts from public sources (verification = VERIFIED, with sourceUrl) or facts supplied by
 *    the club administrator (verification = CLUB_RECORD, shown in admin as "awaiting confirmation").
 *  - Nothing is overwritten on re-run: every upsert has an empty `update`, so admin edits survive.
 *  - Demo attendance data is only created when SEED_DEMO=true (never in production).
 */
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import albumUrls from "./dg-2025-album.json";

const db = new PrismaClient();

const SRC = {
  clubProfile: { label: "District 9213 club profile", url: "https://rotaryd9213.org/ClubInfo/gayaza" },
  directory: { label: "District 9213 club directory", url: "https://rotaryd9213.org/clubdirectory" },
  districtHome: { label: "District 9213 website", url: "https://rotaryd9213.org/" },
  dgEvent2026: { label: "District 9213 events", url: "https://rotaryd9213.org/event/dgs-visit-to-rc-gayaza/" },
  dgStory2025: { label: "District 9213 story, 27 Jul 2025", url: "https://rotaryd9213.org/Stories/dg-geoffrey-visits-rc-gayaza" },
  dgAlbum2025: { label: "District 9213 photo album, Jul 2025", url: "https://rotaryd9213.org/PhotoAlbums/dg-geoffrey-visits-rc-gayaza" },
  newVision2022: { label: "New Vision, 4 Sep 2022", url: "https://www.newvision.co.ug/category/news/rotary-club-of-gayaza-joins-thousands-in-figh-142481" },
  rotaractD9213: { label: "District 9213 club profile (Rotaract)", url: "https://rotaryd9213.org/clubInfo/rotaract-club-of-gayaza" },
  rotaryoClubs: { label: "Rotary-O club search", url: "https://www.rotaryo.org/search/clubs?ClubsSearch%5Bq%5D=gayaza" },
  club: { label: "Club records (supplied by club administrator)", url: null as string | null },
};

const EAT = (s: string) => new Date(`${s}+03:00`);
const photo = (n: string) => `https://clubrunner.blob.core.windows.net/00000050109/PhotoAlbum/dg-geoffrey-visits-rc-gayaza/MCK_${n}.jpg`;
const thumb = (u: string) => u.replace("/00000050109/", "/00000050109/thumb/");

// Observational alt text for photos whose content is clearly visible. Everything else gets a generic alt.
const ALT: Record<string, string> = {
  "5648": "Members unveil a cyclist sculpture bearing the Rotary Club of Gayaza emblem and an End Polio Now sign",
  "5651": "The End Polio Now cyclist sculpture with the Rotary Club of Gayaza wheel",
  "5683": "Members and guests planting trees",
  "5686": "A Rotarian plants a seedling as members gather around with a watering can",
  "5687": "Tree planting during the District Governor's visit",
  "5700": "A water storage tank with a Rotary Club of Gayaza banner",
  "5724": "Members gather at a borehole hand pump during a ribbon-cutting",
  "5733": "Rotarians at the water point opening",
  "5759": "A member speaks in front of the club backdrop: District 9213, Club ID 223384, chartered 16 December 2021",
  "5801": "Students in school uniform with Rotary leaders, one holding a certificate",
  "5859": "Members present a ceremonial cheque to The Rotary Foundation",
  "5868": "A member receives a pin from the visiting governor",
  "5884": "Young people stand beside a Rotary leader speaking into a microphone",
  "5919": "Students in school uniform gather with Rotary leaders",
  "5934": "Club members and guests in a group photograph at dusk",
};

async function main() {
  console.log("Seeding Rotary Club of Gayaza…");

  // ── Home club ────────────────────────────────────────────────
  const gayaza = await db.club.upsert({
    where: { slug: "gayaza" },
    update: {},
    create: {
      slug: "gayaza",
      name: "Rotary Club of Gayaza",
      shortName: "RC Gayaza",
      type: "ROTARY",
      isHome: true,
      district: "9213",
      clubNumber: "223384",
      charterDate: EAT("2021-12-16T12:00:00"),
      charterDateLabel: "16 December 2021",
      meetingDay: "Sunday",
      meetingTime: "5:00 PM",
      venue: "Eriot Recreation Centre Gayaza",
      address: "Off Gayaza–Kalagi Road, opposite the Coca-Cola depot, Gayaza, Uganda",
      latitude: 0.4505711,
      longitude: 32.611057,
      email: "info@rotarygayaza.org",
      website: "https://rotarygayaza.org/",
      xUrl: "https://x.com/Rcgayaza",
      description: "A Rotary club in Gayaza, Wakiso District, Uganda, part of Rotary District 9213.",
      sourceLabel: SRC.clubProfile.label,
      sourceUrl: SRC.clubProfile.url,
      verification: "VERIFIED",
    },
  });

  // ── Rotary family ────────────────────────────────────────────
  const clubs: Array<Prisma.ClubCreateInput & { slug: string }> = [
    { slug: "rc-kasangati", name: "Rotary Club of Kasangati", shortName: "RC Kasangati", type: "ROTARY", district: "9213", verification: "CLUB_RECORD", sourceLabel: SRC.club.label,
      description: "One of the two clubs that supported the founding of the Rotary Club of Gayaza." },
    { slug: "rc-kisaasi-kyanja", name: "Rotary Club of Kisaasi-Kyanja", shortName: "RC Kisaasi-Kyanja", type: "ROTARY", district: "9213", verification: "CLUB_RECORD", sourceLabel: SRC.club.label,
      description: "One of the two clubs that supported the founding of the Rotary Club of Gayaza." },
    { slug: "interact-gayaza-church-of-uganda", name: "Interact Club of Gayaza Church of Uganda", shortName: "Interact · Gayaza C/U", type: "INTERACT", verification: "CLUB_RECORD", sourceLabel: SRC.club.label,
      description: "A school-based Interact club whose chartering the Rotary Club of Gayaza supported." },
    { slug: "interact-st-marys-mawule", name: "Interact Club of St Mary's High School Mawule", shortName: "Interact · St Mary's Mawule", type: "INTERACT", verification: "CLUB_RECORD", sourceLabel: SRC.club.label,
      description: "A school-based Interact club whose chartering the Rotary Club of Gayaza supported." },
    { slug: "rotaract-gayaza-technical", name: "Rotaract Club of Gayaza Technical School", shortName: "Rotaract · Gayaza Technical", type: "ROTARACT", verification: "CLUB_RECORD", sourceLabel: SRC.club.label,
      description: "A Rotaract club whose chartering the Rotary Club of Gayaza supported. Rotary-O lists a \"Gayaza Technical IBC\" Rotaract club that may be the same club (to be confirmed)." },
  ];
  const bySlug: Record<string, string> = { gayaza: gayaza.id };
  for (const c of clubs) {
    const row = await db.club.upsert({ where: { slug: c.slug }, update: {}, create: c });
    bySlug[c.slug] = row.id;
  }

  const rels: Array<{ parent: string; child: string; type: "SUPPORTED" | "SPONSORED" | "MENTORED" | "CHARTERED" | "MOTHER_CLUB"; year?: string; description: string; order: number }> = [
    { parent: "rc-kasangati", child: "gayaza", type: "SUPPORTED", year: "2021", order: 1, description: "Supported the formation of the Rotary Club of Gayaza in 2021." },
    { parent: "rc-kisaasi-kyanja", child: "gayaza", type: "SUPPORTED", year: "2021", order: 2, description: "Supported the formation of the Rotary Club of Gayaza in 2021." },
    { parent: "gayaza", child: "interact-gayaza-church-of-uganda", type: "SUPPORTED", order: 3, description: "RC Gayaza supported the chartering of this Interact club." },
    { parent: "gayaza", child: "interact-st-marys-mawule", type: "SUPPORTED", order: 4, description: "RC Gayaza supported the chartering of this Interact club." },
    { parent: "gayaza", child: "rotaract-gayaza-technical", type: "SUPPORTED", order: 5, description: "RC Gayaza supported the chartering of this Rotaract club." },
  ];
  for (const r of rels) {
    await db.clubRelationship.upsert({
      where: { parentClubId_childClubId_relationshipType: { parentClubId: bySlug[r.parent], childClubId: bySlug[r.child], relationshipType: r.type } },
      update: {},
      create: {
        parentClubId: bySlug[r.parent], childClubId: bySlug[r.child], relationshipType: r.type, year: r.year,
        description: r.description, order: r.order, verification: "CLUB_RECORD", sourceLabel: SRC.club.label,
      },
    });
  }

  // ── Album: DG Geoffrey's visit (real club photography on District 9213) ──
  const album = await db.album.upsert({
    where: { slug: "dg-geoffrey-visit-2025" },
    update: {},
    create: {
      slug: "dg-geoffrey-visit-2025",
      title: "District Governor Geoffrey's visit",
      description: "Photographs from the District Governor's official visit to the Rotary Club of Gayaza, published by District 9213.",
      kind: "DG_VISIT",
      date: EAT("2025-07-27T12:00:00"),
      coverUrl: photo("5934"),
      sourceLabel: SRC.dgAlbum2025.label,
      sourceUrl: SRC.dgAlbum2025.url,
    },
  });
  if ((await db.media.count({ where: { albumId: album.id } })) === 0) {
    await db.media.createMany({
      data: (albumUrls as string[]).map((url, i) => {
        const n = url.match(/MCK_(\d+)/)?.[1] ?? "";
        return {
          url, thumbUrl: thumb(url), albumId: album.id, order: i, kind: "image", mimeType: "image/jpeg",
          alt: ALT[n] ?? "Photograph from the District Governor's visit to the Rotary Club of Gayaza, July 2025",
          credit: "District 9213", sourceUrl: SRC.dgAlbum2025.url, width: 1980, height: 1321,
        };
      }),
    });
  }

  // ── Leadership (District 9213 club profile, accessed Oct 2026) ──
  const officers: Array<[string, string, number]> = [
    ["Noah Ntensibe", "President", 1],
    ["Dan Kiguli", "Vice President · Club Foundation Chair", 2],
    ["Diana Seera", "Secretary", 3],
    ["Chealcious Scarlet Angom", "Treasurer", 4],
    ["Kevin Namata", "Sergeant-at-Arms", 5],
    ["Judith Amwiine Humura", "Executive Secretary / Director", 6],
    ["Frank Ndugga", "Service Projects Chair", 7],
    ["Juliet Nakayenga", "Young Leaders Contact", 8],
    ["Stephen Sango", "Learning Facilitator", 9],
    ["Ernest Mwebesa", "Public Relations", 10],
  ];
  let presidentMemberId: string | undefined;
  for (const [name, role, order] of officers) {
    const memberNumber = `RCG-${String(order).padStart(3, "0")}`;
    const m = await db.member.upsert({
      where: { memberNumber },
      update: {},
      create: {
        memberNumber, fullName: name, rotaryRole: role, roleOrder: order, showOnLeadership: true, publicProfile: true,
        status: "ACTIVE", clubId: gayaza.id, verification: "VERIFIED", sourceLabel: SRC.clubProfile.label, sourceUrl: SRC.clubProfile.url,
      },
    });
    if (order === 1) presidentMemberId = m.id;
  }

  const existingPresident = await db.president.findFirst({ where: { name: "Noah Ntensibe" } });
  if (!existingPresident) {
    await db.president.create({
      data: {
        name: "Noah Ntensibe", rotaryYear: "2026-27", isCurrent: true, memberId: presidentMemberId, clubId: gayaza.id,
        verification: "VERIFIED", sourceLabel: SRC.clubProfile.label, sourceUrl: SRC.clubProfile.url,
        achievements: [], awards: [], archiveLinks: [],
      },
    });
  }

  // ── Events & DG visits ───────────────────────────────────────
  const districtSource = await db.eventSource.upsert({
    where: { key: "d9213-home" }, update: {},
    create: {
      key: "d9213-home", name: "District 9213 — upcoming events (homepage)", kind: "D9213_HOME_EVENTS", url: "https://rotaryd9213.org/",
      keywords: [], notes: "Parses the 'Upcoming Events' list on the district homepage. Carries DG visits, which the iCal feed omits.",
    },
  });
  await db.eventSource.upsert({
    where: { key: "d9213-ical" }, update: {},
    create: {
      key: "d9213-ical", name: "District 9213 — calendar feed (iCal)", kind: "D9213_ICAL", url: "https://rotaryd9213.org/calendar-feed",
      keywords: [], notes: "Structured iCalendar feed published by ClubRunner. Preferred source for district events.",
    },
  });
  await db.eventSource.upsert({
    where: { key: "d9213-stories" }, update: {},
    create: { key: "d9213-stories", name: "District 9213 — stories", kind: "D9213_STORIES", url: "https://rotaryd9213.org/stories", keywords: ["gayaza"], notes: "Finds stories that mention Gayaza." },
  });
  await db.eventSource.upsert({
    where: { key: "d9213-albums" }, update: {},
    create: { key: "d9213-albums", name: "District 9213 — photo albums", kind: "D9213_ALBUMS", url: "https://rotaryd9213.org/photoalbums", keywords: ["gayaza"], notes: "Finds photo albums that mention Gayaza." },
  });
  await db.eventSource.upsert({
    where: { key: "rotaryo-fellowships" }, update: {},
    create: { key: "rotaryo-fellowships", name: "Rotary-O — upcoming fellowships", kind: "ROTARYO_FELLOWSHIPS", url: "https://www.rotaryo.org/search/fellowships", keywords: [], notes: "Rotary-O has no feed or API; the public fellowship list is read conservatively (one page, once per run)." },
  });
  await db.eventSource.upsert({
    where: { key: "manual" }, update: {},
    create: { key: "manual", name: "Manual / Import from URL (incl. X posts)", kind: "URL_IMPORT", url: "https://x.com/Rcgayaza", enabled: false, keywords: [], notes: "X does not offer free, reliable public access. Paste post or page URLs into 'Import from URL' instead." },
  });

  const dgEvent = await db.event.upsert({
    where: { slug: "dg-visit-2026-10-11" },
    update: {},
    create: {
      slug: "dg-visit-2026-10-11",
      title: "District Governor's visit to RC Gayaza",
      description: "The official visit of District Governor Gerald Obai to the Rotary Club of Gayaza.",
      type: "DG_VISIT", scope: "CLUB",
      startsAt: EAT("2026-10-11T15:00:00"),
      venue: "Eriot Recreational Centre", location: "Gayaza", address: "Off Gayaza–Kalagi Road, Gayaza",
      latitude: 0.4505711, longitude: 32.611057,
      organiser: "Rotary Club of Gayaza", featured: true, status: "APPROVED",
      sourceId: districtSource.id, sourceLabel: SRC.dgEvent2026.label, sourceUrl: SRC.dgEvent2026.url,
      externalId: "dgs-visit-to-rc-gayaza", importedAt: new Date(), lastCheckedAt: new Date(),
      dedupeKey: "governor visit gayaza|2026-10-11", clubId: gayaza.id,
    },
  });

  await db.dGVisit.upsert({
    where: { slug: "dg-gerald-obai-2026" },
    update: {},
    create: {
      slug: "dg-gerald-obai-2026", governorName: "Gerald Obai", rotaryYear: "2026-27",
      date: EAT("2026-10-11T15:00:00"), timeLabel: "3:00 PM", venue: "Eriot Recreational Centre",
      summary: "District Governor Gerald Obai's official visit to the Rotary Club of Gayaza for the 2026-27 Rotary year.",
      projectsHighlighted: [], eventId: dgEvent.id, clubId: gayaza.id,
      verification: "VERIFIED", sourceLabel: SRC.dgEvent2026.label, sourceUrl: SRC.dgEvent2026.url,
    },
  });

  await db.dGVisit.upsert({
    where: { slug: "dg-geoffrey-2025" },
    update: {},
    create: {
      slug: "dg-geoffrey-2025", governorName: "Geoffrey", rotaryYear: "2025-26",
      date: EAT("2025-07-27T12:00:00"),
      summary: "District Governor Geoffrey made his official visit to the club in July 2025. The district's report of the visit highlighted the club's health outreach and its training of bodaboda riders.",
      story:
        "District 9213 reported three things from the visit:\n\n" +
        "- **600+ community members** mobilised through health outreach to raise awareness.\n" +
        "- **24+ bodaboda riders** trained in road safety and financial literacy, to improve both their safety and their income.\n" +
        "- Wider community well-being through access to health information and skills development.\n\n" +
        "The district also published a 60-photograph album of the day.",
      projectsHighlighted: ["Community health outreach", "Bodaboda road safety & financial literacy training"],
      heroImageUrl: photo("5868"), albumId: album.id, clubId: gayaza.id,
      verification: "VERIFIED", sourceLabel: SRC.dgStory2025.label, sourceUrl: SRC.dgStory2025.url,
    },
  });

  // ── Projects ────────────────────────────────────────────────
  const projects: Prisma.ProjectCreateInput[] = [
    {
      slug: "community-health-outreach",
      title: "Community health outreach",
      summary: "Health outreach that mobilised more than 600 community members to raise awareness and widen access to health information.",
      action: "The club mobilised community members through health outreach to boost awareness of health issues and expand access to health information.",
      result: "More than 600 community members mobilised, as reported to District 9213 in July 2025.",
      dateLabel: "Reported July 2025", areaOfFocus: "Disease prevention and treatment", impactCategory: "Health",
      projectType: "Community outreach", peopleReached: "600+", partners: [], outcomes: ["600+ community members mobilised"],
      heroImageUrl: photo("5934"), featured: true, projectStatus: "Completed",
      verification: "VERIFIED", sourceLabel: SRC.dgStory2025.label, sourceUrl: SRC.dgStory2025.url, status: "PUBLISHED",
      club: { connect: { id: gayaza.id } },
    },
    {
      slug: "bodaboda-road-safety-financial-literacy",
      title: "Road safety and financial literacy for bodaboda riders",
      summary: "Training for motorcycle-taxi riders in road safety and financial literacy, to make their work safer and their income stronger.",
      action: "The club trained bodaboda riders in road safety and in financial literacy.",
      result: "24+ riders trained, as reported to District 9213 in July 2025.",
      dateLabel: "Reported July 2025", areaOfFocus: "Community economic development", impactCategory: "Road Safety",
      projectType: "Training", peopleReached: "24+ riders", partners: [], outcomes: ["24+ bodaboda riders trained"],
      featured: true, projectStatus: "Completed",
      verification: "VERIFIED", sourceLabel: SRC.dgStory2025.label, sourceUrl: SRC.dgStory2025.url, status: "PUBLISHED",
      club: { connect: { id: gayaza.id } },
    },
    {
      slug: "covid-19-household-support-2021",
      title: "COVID-19 household support in Mundazabazzadde and Nakwero A",
      summary: "One of the club's earliest service activities: support to households affected by COVID-19 in Mundazabazzadde and Nakwero A.",
      action: "Members reached households in Mundazabazzadde and Nakwero A that had been affected by COVID-19.",
      dateLabel: "29 August 2021", startDate: EAT("2021-08-29T09:00:00"), rotaryYear: "2021-22",
      location: "Mundazabazzadde and Nakwero A", areaOfFocus: "Community economic development", impactCategory: "Community Development",
      projectType: "Relief", partners: [], outcomes: [], projectStatus: "Completed", featured: true,
      verification: "CLUB_RECORD", sourceLabel: SRC.club.label, status: "PUBLISHED",
      club: { connect: { id: gayaza.id } },
    },
    {
      slug: "rotary-cancer-run-2022",
      title: "Rotary Cancer Run 2022",
      summary: "Club members joined thousands of runners in the 2022 Rotary Cancer Run, which raised funds towards modern cancer treatment equipment.",
      action: "The club took part in the national Rotary Cancer Run.",
      dateLabel: "2022", startDate: EAT("2022-08-28T07:00:00"), rotaryYear: "2022-23",
      areaOfFocus: "Disease prevention and treatment", impactCategory: "Cancer / Fundraising", projectType: "Fundraising run",
      partners: [], outcomes: [], projectStatus: "Completed",
      verification: "VERIFIED", sourceLabel: SRC.newVision2022.label, sourceUrl: SRC.newVision2022.url, status: "PUBLISHED",
      club: { connect: { id: gayaza.id } },
    },
    {
      slug: "youth-club-development",
      title: "Growing Interact and Rotaract",
      summary: "Supporting the chartering of two school Interact clubs and a Rotaract club, so that young people in and around Gayaza can lead service of their own.",
      action: "The club supported the chartering of the Interact Club of Gayaza Church of Uganda, the Interact Club of St Mary's High School Mawule and the Rotaract Club of Gayaza Technical School.",
      dateLabel: "Since 2022", areaOfFocus: "Youth leadership", impactCategory: "Youth", projectType: "Youth development",
      peopleReached: "3 youth clubs", partners: [], outcomes: ["3 youth clubs supported"], projectStatus: "Ongoing", featured: true,
      heroImageUrl: photo("5919"),
      verification: "CLUB_RECORD", sourceLabel: SRC.club.label, status: "PUBLISHED",
      club: { connect: { id: gayaza.id } },
    },
  ];
  for (const p of projects) await db.project.upsert({ where: { slug: p.slug }, update: {}, create: p });

  // ── Stories ─────────────────────────────────────────────────
  const healthProject = await db.project.findUnique({ where: { slug: "community-health-outreach" } });
  await db.story.upsert({
    where: { slug: "governors-visit-july-2025" },
    update: {},
    create: {
      slug: "governors-visit-july-2025",
      title: "600 neighbours, 24 riders and a Governor's visit",
      dek: "When District Governor Geoffrey visited in July 2025, the club showed what four years of Sunday meetings had turned into.",
      body:
        "On **27 July 2025** the District 9213 Governor made his official visit to the Rotary Club of Gayaza.\n\n" +
        "The district's report of the day picked out two pieces of work. Through **health outreach**, the club had mobilised more than **600 community members** to raise awareness and widen access to health information. It had also trained more than **24 bodaboda riders** in road safety and financial literacy.\n\n" +
        "The district published 60 photographs of the visit. They show members planting trees, gathering at a water point and standing with students from local schools.",
      heroImageUrl: photo("5934"), place: "Gayaza", people: ["District Governor Geoffrey"],
      impact: "600+ community members mobilised · 24+ bodaboda riders trained",
      projectId: healthProject?.id, albumId: album.id, publishedAt: EAT("2025-07-27T12:00:00"), featured: true,
      verification: "VERIFIED", sourceLabel: SRC.dgStory2025.label, sourceUrl: SRC.dgStory2025.url, status: "PUBLISHED",
    },
  });
  const cancerProject = await db.project.findUnique({ where: { slug: "rotary-cancer-run-2022" } });
  await db.story.upsert({
    where: { slug: "running-against-cancer-2022" },
    update: {},
    create: {
      slug: "running-against-cancer-2022",
      title: "Running against cancer",
      dek: "In its first year as a chartered club, Gayaza joined thousands of runners in the Rotary Cancer Run.",
      body:
        "The Rotary Cancer Run is one of Uganda's largest fundraising runs. In 2022 the Rotary Club of Gayaza was among the clubs taking part. The run's proceeds were directed towards modern cancer treatment equipment.\n\n" +
        "New Vision reported the club's participation on 4 September 2022. Read the original report at the source link below.",
      place: "Kampala", people: [], projectId: cancerProject?.id, publishedAt: EAT("2022-09-04T12:00:00"),
      verification: "VERIFIED", sourceLabel: SRC.newVision2022.label, sourceUrl: SRC.newVision2022.url, status: "PUBLISHED",
    },
  });

  // ── Impact metrics ──────────────────────────────────────────
  const metrics: Prisma.ImpactMetricCreateInput[] = [
    { value: "600+", numericValue: 600, label: "community members mobilised through health outreach", period: "Reported July 2025", category: "Health", order: 1,
      verification: "VERIFIED", sourceLabel: SRC.dgStory2025.label, sourceUrl: SRC.dgStory2025.url },
    { value: "24+", numericValue: 24, label: "bodaboda riders trained in road safety and financial literacy", period: "Reported July 2025", category: "Road Safety", order: 2,
      verification: "VERIFIED", sourceLabel: SRC.dgStory2025.label, sourceUrl: SRC.dgStory2025.url },
    { value: "35", numericValue: 35, label: "charter members", period: "At charter, December 2021", category: "Leadership", order: 3,
      verification: "CLUB_RECORD", sourceLabel: SRC.club.label },
    { value: "3", numericValue: 3, label: "youth clubs whose chartering we supported", period: "Since 2022", category: "Youth", order: 4,
      verification: "CLUB_RECORD", sourceLabel: SRC.club.label },
    { value: "9", numericValue: 9, label: "service projects in one Rotary year", period: "Rotary year to be confirmed", category: "Community Development", order: 5,
      verification: "NEEDS_CONFIRMATION", sourceLabel: SRC.club.label, status: "DRAFT", featured: false },
  ];
  if ((await db.impactMetric.count()) === 0) for (const m of metrics) await db.impactMetric.create({ data: m });

  // ── Timeline ────────────────────────────────────────────────
  const timeline: Prisma.TimelineEntryCreateInput[] = [
    { date: EAT("2021-06-01T00:00:00"), dateLabel: "June 2021", title: "Formal meetings begin", kind: "FORMATION", chapter: "where-we-started",
      description: "A group of neighbours in Gayaza begin meeting formally as a Rotary club in formation, supported by the Rotary Clubs of Kasangati and Kisaasi-Kyanja.",
      verification: "CLUB_RECORD", sourceLabel: SRC.club.label },
    { date: EAT("2021-08-29T00:00:00"), dateLabel: "29 August 2021", title: "First service in the community", kind: "PROJECT", chapter: "where-we-started",
      description: "Members support COVID-19-affected households in Mundazabazzadde and Nakwero A.", linkUrl: "/projects/covid-19-household-support-2021",
      verification: "CLUB_RECORD", sourceLabel: SRC.club.label },
    { date: EAT("2021-12-16T00:00:00"), dateLabel: "16 December 2021", title: "Chartered", kind: "CHARTER", chapter: "where-we-started",
      description: "Rotary International charters the Rotary Club of Gayaza (Club ID 223384) in District 9213, with 35 charter members.",
      imageUrl: photo("5759"), verification: "VERIFIED", sourceLabel: "Club backdrop, District 9213 photo album", sourceUrl: SRC.dgAlbum2025.url },
    { date: EAT("2022-02-05T00:00:00"), dateLabel: "5 February 2022", title: "Charter celebration", kind: "MILESTONE", chapter: "where-we-started",
      description: "The club celebrates its charter.", verification: "CLUB_RECORD", sourceLabel: SRC.club.label },
    { date: EAT("2022-05-29T00:00:00"), dateLabel: "29 May 2022", title: "First installation", kind: "LEADERSHIP", chapter: "how-we-grew",
      description: "The club installs its first board of officers.", verification: "CLUB_RECORD", sourceLabel: SRC.club.label },
    { date: EAT("2022-08-28T00:00:00"), dateLabel: "2022", title: "Running against cancer", kind: "PROJECT", chapter: "how-we-grew",
      description: "Members join thousands of runners in the Rotary Cancer Run.", linkUrl: "/stories/running-against-cancer-2022",
      verification: "VERIFIED", sourceLabel: SRC.newVision2022.label, sourceUrl: SRC.newVision2022.url },
    { date: EAT("2023-01-01T00:00:00"), dateLabel: "Since 2022", title: "New branches: Interact and Rotaract", kind: "YOUTH_CLUB", chapter: "how-we-grew",
      description: "The club supports the chartering of two school Interact clubs and the Rotaract Club of Gayaza Technical School.", linkUrl: "/rotary-family",
      verification: "CLUB_RECORD", sourceLabel: SRC.club.label },
    { date: EAT("2025-07-27T00:00:00"), dateLabel: "27 July 2025", title: "District Governor Geoffrey visits", kind: "DG_VISIT", chapter: "how-we-grew",
      description: "The district reports 600+ community members mobilised through health outreach and 24+ bodaboda riders trained.",
      imageUrl: photo("5868"), linkUrl: "/district-governor", verification: "VERIFIED", sourceLabel: SRC.dgStory2025.label, sourceUrl: SRC.dgStory2025.url },
    { date: EAT("2026-07-01T00:00:00"), dateLabel: "Rotary year 2026-27", title: "Noah Ntensibe leads the club", kind: "LEADERSHIP", chapter: "where-we-are-going",
      description: "Noah Ntensibe is listed by District 9213 as club president.", linkUrl: "/leadership",
      verification: "VERIFIED", sourceLabel: SRC.clubProfile.label, sourceUrl: SRC.clubProfile.url },
    { date: EAT("2026-10-11T15:00:00"), dateLabel: "11 October 2026", title: "District Governor Gerald Obai visits", kind: "UPCOMING", chapter: "where-we-are-going",
      description: "The Governor's official visit, 3:00 PM at Eriot Recreational Centre.", linkUrl: "/district-governor",
      verification: "VERIFIED", sourceLabel: SRC.dgEvent2026.label, sourceUrl: SRC.dgEvent2026.url },
  ];
  if ((await db.timelineEntry.count()) === 0) for (const t of timeline) await db.timelineEntry.create({ data: t });

  // ── Editable page sections ──────────────────────────────────
  const sections: Prisma.SiteSectionCreateInput[] = [
    { key: "home.hero", eyebrow: "Rotary District 9213 · Gayaza, Uganda", title: "Service takes root in Gayaza.",
      body: "People of action in Gayaza — meeting every Sunday, and turning that fellowship into service, leadership and new clubs.",
      imageUrl: photo("5686"), order: 1 },
    { key: "home.who", eyebrow: "Who we are", title: "A young club with deep roots.",
      body: "The Rotary Club of Gayaza began meeting in June 2021 and was chartered on 16 December 2021, with the support of the Rotary Clubs of Kasangati and Kisaasi-Kyanja.\n\nWe are part of Rotary District 9213 and of Rotary International's global network of *people of action*. Every Sunday at 5:00 PM we meet at Eriot Recreation Centre, off Gayaza–Kalagi Road. Visitors are always welcome.",
      order: 2 },
    { key: "home.join", eyebrow: "Get involved", title: "There is a seat for you on Sunday.",
      body: "You do not need to be a member to start. Come to a fellowship, support a project or bring an idea. That is how most of us began.",
      order: 3 },
    { key: "story.where-we-started", eyebrow: "Chapter one", title: "Where we started", order: 10,
      body: "In mid-2021, during the COVID-19 pandemic, a group in Gayaza started meeting formally as a Rotary club in formation. Two neighbouring clubs supported them: the Rotary Club of Kasangati and the Rotary Club of Kisaasi-Kyanja. Within months, the group was out in Mundazabazzadde and Nakwero A supporting affected households. On 16 December 2021 the club received its charter." },
    { key: "story.how-we-grew", eyebrow: "Chapter two", title: "How we grew", order: 11,
      body: "A chartered club installs officers, joins district life and builds a habit of service. Gayaza did all three. It also did something many young clubs wait years to attempt: it helped young people start clubs of their own." },
    { key: "story.what-we-learned", eyebrow: "Chapter three", title: "What we learned", order: 12, status: "DRAFT",
      body: "_For the club to write: lessons from the first five years, in members' own words._" },
    { key: "story.where-we-are-going", eyebrow: "Chapter four", title: "Where we are going", order: 13,
      body: "The 2026-27 Rotary year opens under President Noah Ntensibe, with District Governor Gerald Obai's official visit on 11 October 2026." },
  ];
  for (const s of sections) await db.siteSection.upsert({ where: { key: s.key }, update: {}, create: s });

  // ── Members' announcement ───────────────────────────────────
  if ((await db.announcement.count()) === 0) {
    await db.announcement.create({
      data: {
        title: "District Governor's visit — Sunday 11 October, 3:00 PM",
        body: "DG Gerald Obai makes his official visit to our club at Eriot Recreational Centre. Please note the earlier start time.",
        audience: "members", pinned: true, expiresAt: EAT("2026-10-12T00:00:00"),
      },
    });
  }

  // ── Attendance: the DG visit meeting ────────────────────────
  if (!(await db.meeting.findFirst({ where: { eventId: dgEvent.id } }))) {
    await db.meeting.create({
      data: { title: "District Governor's official visit", type: "DG_VISIT", date: EAT("2026-10-11T15:00:00"), endsAt: EAT("2026-10-11T18:00:00"),
        rotaryYear: "2026-27", venue: "Eriot Recreational Centre", eventId: dgEvent.id },
    });
  }

  // ── Discovered online: leads found during research, for editorial review ──
  const leads: Prisma.DiscoveredItemCreateInput[] = [
    { sourceKey: "research", sourceLabel: "District 9213", type: "CLUB", title: "Rotaract Club of Gayaza (community-based)", url: SRC.rotaractD9213.url,
      summary: "District 9213 lists a Rotaract Club of Gayaza (club 8826239) that meets on Sundays. The public sources do not say whether RC Gayaza sponsored it. Confirm before adding it to the Rotary family.",
      suggestedDestination: "family", dedupeKey: "research:rotaract-gayaza" },
    { sourceKey: "research", sourceLabel: "Rotary-O", type: "CLUB", title: "\"Gayaza Technical IBC\" (Rotaract) on Rotary-O", url: SRC.rotaryoClubs.url,
      summary: "This may be the same club as the Rotaract Club of Gayaza Technical School. Confirm and merge.", suggestedDestination: "family", dedupeKey: "research:gayaza-technical-ibc" },
    { sourceKey: "research", sourceLabel: "Rotary-O", type: "CLUB", title: "\"Gayaza Football\" club on Rotary-O", url: SRC.rotaryoClubs.url,
      summary: "Listed on Rotary-O. The district calendar had a 'DRR's Visit, Rac Gayaza Football' on 9 Nov 2025. The relationship to RC Gayaza is unknown.", suggestedDestination: "family", dedupeKey: "research:gayaza-football" },
    { sourceKey: "research", sourceLabel: "District 9213 album", type: "PHOTO_ALBUM", title: "Undocumented projects visible in the July 2025 album", url: SRC.dgAlbum2025.url,
      summary: "The DG-visit photographs show an End Polio Now cyclist sculpture, tree planting, a water tank, a borehole/water-point opening, student certificates and a cheque to The Rotary Foundation (Polio Plus & Annual Fund). Write each one up as a project, using the club's own facts.",
      suggestedDestination: "projects", imageUrl: photo("5651"), dedupeKey: "research:album-2025-projects" },
    { sourceKey: "research", sourceLabel: "rotarygayaza.org (offline Oct 2026)", type: "OTHER", title: "Historic club web pages to recover", url: "https://rotarygayaza.org/",
      summary: "Search results show these pages: World Polio Day; Church of Uganda Gayaza Kadongo Primary School; St Lillian Correction Center; Home hospitality; The rise of Rotary Club of Gayaza. The site returned 503 errors during research. The Mabati Times bulletin PDF was also unreachable. Recover them from the club's own files.",
      suggestedDestination: "stories", dedupeKey: "research:rotarygayaza-pages" },
    { sourceKey: "research", sourceLabel: "District 9213", type: "CLUB_MENTION", title: "Name check: story posted by \"Noah Nyabwana\"", url: SRC.dgStory2025.url,
      summary: "The district story was posted by \"Noah Nyabwana\", but the current president is listed as \"Noah Ntensibe\". Confirm whether these are the same person.",
      suggestedDestination: "leadership", dedupeKey: "research:noah-name" },
  ];
  for (const l of leads) await db.discoveredItem.upsert({ where: { dedupeKey: l.dedupeKey }, update: {}, create: l });

  // ── First admin (optional, from env) ───────────────────────
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password) {
    const exists = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!exists) {
      await db.user.create({ data: { email: email.toLowerCase(), name: process.env.SEED_ADMIN_NAME || "Club Administrator", role: "SUPER_ADMIN", passwordHash: await bcrypt.hash(password, 11) } });
      console.log(`  ✓ super admin ${email} created`);
    }
  } else if ((await db.user.count()) === 0) {
    console.log("  ! No admin user yet. Run `npm run admin:create` (or set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD).");
  }

  await seedOctober2026(gayaza.id);
  if (process.env.SEED_DEMO === "true") await seedDemo();
  console.log("Done.");
}

/**
 * Content supplied by the club administrator on 3 Oct 2026 (club records) plus two verified press
 * items. Every write is create-if-missing, so re-running never overwrites edits made in the admin.
 */
async function seedOctober2026(gayazaId: string) {
  const CLUB_REC = { verification: "CLUB_RECORD" as const, sourceLabel: SRC.club.label };
  const BUKEDDE = { label: "Bukedde, 29 Sep 2026", url: "https://www.bukedde.co.ug/amawulire/BUK_162097_092026/asiimye-bannalotale-ye-gayaza-okuyambako-gavt" };

  // Clubs mothered by RC Gayaza
  const mothered: Array<[string, string, string]> = [
    ["rotaract-gayaza", "Rotaract Club of Gayaza", "Rotaract · Gayaza"],
    ["rotaract-gayaza-football", "Rotaract Club of Gayaza Football", "Rotaract · Gayaza Football"],
    ["rotaract-manyangwa-football", "Rotaract Club of Manyangwa Football", "Rotaract · Manyangwa Football"],
    ["rotaract-bugema", "Rotaract Club of Bugema", "Rotaract · Bugema"],
  ];
  for (const [slug, name, shortName] of mothered) {
    const c = await db.club.upsert({ where: { slug }, update: {}, create: { slug, name, shortName, type: "ROTARACT", district: "9213", description: `A Rotaract club mothered by the Rotary Club of Gayaza.`, ...CLUB_REC } });
    await db.clubRelationship.upsert({
      where: { parentClubId_childClubId_relationshipType: { parentClubId: gayazaId, childClubId: c.id, relationshipType: "MOTHER_CLUB" } },
      update: {},
      create: { parentClubId: gayazaId, childClubId: c.id, relationshipType: "MOTHER_CLUB", description: `RC Gayaza is the mother club of the ${name}.`, order: 10, ...CLUB_REC },
    });
  }
  await db.discoveredItem.updateMany({ where: { dedupeKey: { in: ["research:rotaract-gayaza", "research:gayaza-football"] }, status: "NEW" }, data: { status: "APPROVED", reviewedAt: new Date() } });
  await db.impactMetric.updateMany({ where: { value: "3", label: "youth clubs whose chartering we supported" }, data: { value: "7", numericValue: 7, label: "Rotaract and Interact clubs mothered or supported", period: "Since 2022" } });

  // Sponsors
  const sponsors: Array<[string, string | null, number]> = [
    ["Peoples Medical Hospital", "https://peoplesmedicalhospital.com/", 1],
    ["St Mark's Schools Kayunga", "https://stmarkschools.com/", 2],
    ["St. Eliza Pharmacy & Diagnostic Center, Gayaza", null, 3],
    ["Niyo Garage", "https://niyogarage.com/", 4],
  ];
  for (const [name, url, order] of sponsors) {
    if (!(await db.sponsor.findFirst({ where: { name } }))) await db.sponsor.create({ data: { name, url, order } });
  }

  // Media appearances
  const press = [
    { url: BUKEDDE.url, title: "Asiimye bannalotale y'e Gayaza okuyambako Gavt okutuusa empeereza ku bantu", titleEnglish: "Gayaza Rotarians praised for helping government bring services to the people",
      outlet: "Bukedde", kind: "article", language: "Luganda", date: EAT("2026-09-29T12:00:00"), order: 1,
      summary: "Kasangati RDC James Kalisema inspected the clean-water project the club is building at Gayaza C/U Primary School (Kaddongo)." },
    { url: "https://www.youtube.com/watch?v=1OuH4yiCUI0", title: "Agookya okulwanyisa obubenje mu ggwanga", outlet: "Top TV Uganda", kind: "video", language: "Luganda", order: 2,
      summary: "A Top TV Uganda feature on the fight against road accidents." },
    { url: SRC.newVision2022.url, title: "Rotary Club of Gayaza joins thousands in fight against cancer", outlet: "New Vision", kind: "article", language: "English", date: EAT("2022-09-04T12:00:00"), order: 3,
      summary: "The club took part in the 2022 Rotary Cancer Run." },
  ];
  for (const m of press) await db.pressMention.upsert({ where: { url: m.url }, update: {}, create: m });

  // Projects documented in the Bukedde report
  const projects: Prisma.ProjectCreateInput[] = [
    {
      slug: "kaddongo-clean-water",
      title: "Clean water for Gayaza C/U Primary School (Kaddongo)",
      summary: "Nine taps for the school and two for the neighbouring village, supplied free of charge from a 10,000-litre tank.",
      action: "The club is installing nine taps at Gayaza C/U Primary School, known as Kaddongo, and two taps for the surrounding village. The water is drawn from underground into a 10,000-litre tank that feeds the taps. Kasthew Construction Ltd is carrying out the works.",
      people: "Pupils and staff of Gayaza C/U Primary School, and residents of the neighbouring village.",
      result: "Kasangati RDC James Kalisema inspected the works in September 2026 and thanked the club. The contractor expects completion in October 2026.",
      dateLabel: "September 2026", startDate: EAT("2026-09-27T12:00:00"), rotaryYear: "2026-27", location: "Kaddongo, Gayaza",
      areaOfFocus: "Water, sanitation and hygiene", impactCategory: "Water & Sanitation", projectType: "Clean water", peopleReached: "11 taps",
      partners: [], outcomes: ["9 taps at the school", "2 taps for the village", "10,000-litre storage tank"], projectStatus: "Ongoing", featured: true,
      verification: "VERIFIED", sourceLabel: BUKEDDE.label, sourceUrl: BUKEDDE.url, status: "PUBLISHED", club: { connect: { id: gayazaId } },
    },
    {
      slug: "kiwenda-clean-water",
      title: "Clean water for Kiwenda and Springfield Junior School",
      summary: "An earlier project that brought clean water to residents of Kiwenda, Nansana Municipality, and to Springfield Junior School.",
      action: "The club provided clean water to residents of Kiwenda in Nansana Municipality and to Springfield Junior School, Kiwenda.",
      dateLabel: "Earlier project", location: "Kiwenda, Nansana", areaOfFocus: "Water, sanitation and hygiene", impactCategory: "Water & Sanitation", projectType: "Clean water",
      partners: [], outcomes: [], projectStatus: "Completed",
      verification: "VERIFIED", sourceLabel: BUKEDDE.label, sourceUrl: BUKEDDE.url, status: "PUBLISHED", club: { connect: { id: gayazaId } },
    },
  ];
  for (const p of projects) await db.project.upsert({ where: { slug: p.slug }, update: {}, create: p });

  if (!(await db.timelineEntry.findFirst({ where: { title: "Clean water for Kaddongo" } }))) {
    await db.timelineEntry.create({ data: { date: EAT("2026-09-27T00:00:00"), dateLabel: "September 2026", title: "Clean water for Kaddongo", kind: "PROJECT", chapter: "where-we-are-going",
      description: "The club installs taps for Gayaza C/U Primary School and the neighbouring village; the Kasangati RDC inspects the works.", linkUrl: "/projects/kaddongo-clean-water",
      verification: "VERIFIED", sourceLabel: BUKEDDE.label, sourceUrl: BUKEDDE.url } });
  }

  // Next fellowship — Sunday 4 October 2026
  await db.event.upsert({
    where: { slug: "sustaining-the-engine-of-impact-2026-10-04" },
    update: {},
    create: {
      slug: "sustaining-the-engine-of-impact-2026-10-04",
      title: "Sustaining the Engine of Impact: Deep reflection and intentional resilience",
      description:
        "Every Rotary journey is built on moments of service, growth, resilience and impact.\n\n" +
        "The Rotary Club of Gayaza, jointly with the Rotaract Clubs of Gayaza, Gayaza Football, Manyangwa Football, Gayaza Technical, Pere Cadet and Bugema, invites you to an afternoon of deep reflection, celebration and renewed purpose as we look back at the milestones that have shaped our journey, and look forward to the road ahead.\n\n" +
        "It is a time to celebrate what we have achieved, acknowledge the lessons along the way, and ask the important question: **how do we sustain the engine of impact?**\n\n" +
        "Join us for an inspiring conversation with **PDG Ken Wycliffe Mugisha**, Past District Governor of District 9213, as we reflect on intentional resilience, leadership and service.\n\n" +
        "- Come celebrate with us.\n- Come reflect on the lessons.\n- Come ready to reignite the engine of impact.\n\n" +
        "#RotaryEyamba · #RotaryKonyo · Safe Roads Save Lives",
      type: "FELLOWSHIP", scope: "CLUB",
      startsAt: EAT("2026-10-04T16:00:00"),
      venue: "Eriot Recreation Centre", location: "Gayaza", address: "Off Gayaza–Kalagi Road, Gayaza", latitude: 0.4505711, longitude: 32.611057,
      organiser: "Rotary Club of Gayaza with the Rotaract Clubs of Gayaza, Gayaza Football, Manyangwa Football, Gayaza Technical, Pere Cadet and Bugema",
      imageUrl: "/events/sustaining-the-engine-of-impact.jpg", featured: true, status: "APPROVED",
      sourceLabel: SRC.club.label, dedupeKey: "sustaining engine impact|2026-10-04", clubId: gayazaId,
    },
  });
}

/** Clearly-labelled demo data for local testing of attendance analytics. Never enable in production. */
async function seedDemo() {
  console.log("  • SEED_DEMO=true — adding demo members and meetings");
  const pin = await bcrypt.hash("1234", 11);
  const ids: string[] = [];
  for (let i = 1; i <= 24; i++) {
    const memberNumber = `DEMO-${String(i).padStart(2, "0")}`;
    const m = await db.member.upsert({
      where: { memberNumber }, update: {},
      create: { memberNumber, fullName: `Demo Member ${String(i).padStart(2, "0")}`, pinHash: pin, pinSetAt: new Date(), joinDate: EAT("2024-01-01T00:00:00"), status: i > 22 ? "INACTIVE" : "ACTIVE", verification: "NEEDS_CONFIRMATION", sourceLabel: "DEMO DATA" },
    });
    ids.push(m.id);
  }
  if (await db.meeting.findFirst({ where: { notes: "DEMO" } })) return;
  const start = EAT("2025-07-06T17:00:00");
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let w = 0; w < 64; w++) {
    const date = new Date(start.getTime() + w * 7 * 864e5);
    if (date > new Date()) break;
    const ry = (() => { const y = date.getUTCFullYear(), m = date.getUTCMonth() + 1; const s = m >= 7 ? y : y - 1; return `${s}-${String((s + 1) % 100).padStart(2, "0")}`; })();
    const meeting = await db.meeting.create({ data: { title: "Weekly fellowship", type: "REGULAR", date, rotaryYear: ry, venue: "Eriot Recreation Centre Gayaza", notes: "DEMO", guestCount: Math.floor(rnd() * 5) } });
    const rate = 0.45 + 0.35 * Math.sin(w / 6) ** 2;
    const rows: Prisma.AttendanceRecordCreateManyInput[] = ids.slice(0, 22).flatMap((memberId, idx): Prisma.AttendanceRecordCreateManyInput[] => {
      const r = rnd();
      if (r < rate * (1 - idx / 60)) return [{ meetingId: meeting.id, memberId, status: "PRESENT" as const, method: (rnd() > 0.2 ? "QR" : "MANUAL") as "QR" | "MANUAL", checkedInAt: new Date(date.getTime() + rnd() * 3600e3) }];
      if (r > 0.94) return [{ meetingId: meeting.id, memberId, status: "EXCUSED" as const, method: "MANUAL" as const, checkedInAt: date }];
      return [];
    });
    await db.attendanceRecord.createMany({ data: rows });
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
