import type { Permission } from "@/lib/permissions";

/**
 * Declarative admin resources. One generic list/edit UI drives every content type, so a club
 * administrator gets a consistent experience and developers add a field in one place.
 */
export type FieldType =
  | "text" | "textarea" | "markdown" | "url" | "email" | "number" | "int"
  | "date" | "datetime" | "boolean" | "select" | "list" | "image" | "relation" | "slug";

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  options?: readonly (string | readonly [string, string])[];
  relation?: { model: string; label: string; where?: Record<string, unknown>; orderBy?: Record<string, "asc" | "desc"> };
  wide?: boolean; // span both columns
  section?: string; // groups fields under a heading
};

export type Resource = {
  key: string;
  model: string; // prisma delegate name
  label: string;
  singular: string;
  perm: Permission;
  fields: Field[];
  columns: string[];
  search: string[];
  orderBy: Record<string, "asc" | "desc">[];
  titleField: string;
  slugFrom?: string;
  publicPath?: (row: Record<string, unknown>) => string | null;
  statusOptions?: readonly string[];
  help?: string;
};

const CONTENT_STATUS = ["DRAFT", "PENDING_REVIEW", "PUBLISHED", "ARCHIVED"] as const;
const EVENT_STATUS = ["PENDING_REVIEW", "APPROVED", "REJECTED", "ARCHIVED"] as const;
const VERIFICATION = [["VERIFIED", "Verified — public source linked"], ["CLUB_RECORD", "Club record — awaiting confirmation"], ["NEEDS_CONFIRMATION", "Needs confirmation / conflicting"]] as const;
const AREAS = ["Peacebuilding and conflict prevention", "Disease prevention and treatment", "Water, sanitation and hygiene", "Maternal and child health", "Basic education and literacy", "Community economic development", "The environment", "Youth leadership", "Other"] as const;
const IMPACT = ["Health", "Water & Sanitation", "Education", "Youth", "Community Development", "Road Safety", "Environment", "Economic Empowerment", "Cancer / Fundraising", "Leadership"] as const;

const provenance: Field[] = [
  { name: "verification", label: "Verification", type: "select", options: VERIFICATION, section: "Provenance", help: "Never publish an invented fact. Link a public source, or mark it as a club record awaiting confirmation." },
  { name: "sourceLabel", label: "Source label", type: "text", section: "Provenance" },
  { name: "sourceUrl", label: "Source URL", type: "url", section: "Provenance" },
];

export const RESOURCES: Resource[] = [
  {
    key: "projects", model: "project", label: "Projects", singular: "Project", perm: "projects", titleField: "title", slugFrom: "title",
    columns: ["title", "impactCategory", "dateLabel", "featured", "verification", "status"], search: ["title", "summary", "location"],
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }], statusOptions: CONTENT_STATUS, publicPath: (r) => `/projects/${r.slug}`,
    fields: [
      { name: "title", label: "Title", type: "text", required: true, wide: true },
      { name: "slug", label: "URL slug", type: "slug", help: "Leave blank to generate from the title. Example: health-outreach-2025" },
      { name: "status", label: "Status", type: "select", options: CONTENT_STATUS },
      { name: "summary", label: "Summary", type: "textarea", wide: true },
      { name: "heroImageUrl", label: "Hero image", type: "image", wide: true },
      { name: "challenge", label: "The challenge", type: "textarea", section: "Story structure" },
      { name: "action", label: "The action (what the club did)", type: "textarea", section: "Story structure" },
      { name: "people", label: "The people", type: "textarea", section: "Story structure" },
      { name: "result", label: "The result", type: "textarea", section: "Story structure" },
      { name: "story", label: "The story (long form)", type: "markdown", wide: true, section: "Story structure" },
      { name: "dateLabel", label: "Date (as displayed)", type: "text", section: "When & where", help: "e.g. 29 August 2021, or Reported July 2025" },
      { name: "startDate", label: "Start date", type: "date", section: "When & where" },
      { name: "endDate", label: "End date", type: "date", section: "When & where" },
      { name: "rotaryYear", label: "Rotary year", type: "text", section: "When & where", help: "e.g. 2025-26" },
      { name: "location", label: "Location", type: "text", section: "When & where" },
      { name: "latitude", label: "Latitude", type: "number", section: "When & where", help: "Only if known precisely — never guess." },
      { name: "longitude", label: "Longitude", type: "number", section: "When & where" },
      { name: "areaOfFocus", label: "Rotary area of focus", type: "select", options: AREAS, section: "Classification" },
      { name: "impactCategory", label: "Impact area", type: "select", options: IMPACT, section: "Classification" },
      { name: "projectType", label: "Project type", type: "text", section: "Classification" },
      { name: "projectStatus", label: "Project status", type: "select", options: ["Planned", "Ongoing", "Completed"], section: "Classification" },
      { name: "featured", label: "Featured on homepage", type: "boolean", section: "Classification" },
      { name: "participants", label: "Participants", type: "text", section: "Numbers" },
      { name: "peopleReached", label: "People reached", type: "text", section: "Numbers", help: "As documented, e.g. 600+" },
      { name: "budget", label: "Budget", type: "text", section: "Numbers" },
      { name: "fundingSource", label: "Funding source", type: "text", section: "Numbers" },
      { name: "partners", label: "Partners (one per line)", type: "list", section: "Numbers" },
      { name: "outcomes", label: "Measurable outcomes (one per line)", type: "list", section: "Numbers" },
      { name: "albumId", label: "Photo album", type: "relation", relation: { model: "album", label: "title" }, section: "Media & evidence" },
      { name: "videoUrls", label: "Video URLs (one per line)", type: "list", section: "Media & evidence" },
      { name: "documentUrls", label: "Document URLs (one per line)", type: "list", section: "Media & evidence" },
      { name: "externalLinks", label: "External links (one per line)", type: "list", section: "Media & evidence" },
      ...provenance,
    ],
  },
  {
    key: "stories", model: "story", label: "Stories", singular: "Story", perm: "stories", titleField: "title", slugFrom: "title",
    columns: ["title", "place", "publishedAt", "featured", "verification", "status"], search: ["title", "dek", "body"],
    orderBy: [{ publishedAt: "desc" }], statusOptions: CONTENT_STATUS, publicPath: (r) => `/stories/${r.slug}`,
    help: "Mini magazine articles. If a story originated elsewhere, summarise it in your own words and add the source — never paste long articles.",
    fields: [
      { name: "title", label: "Headline", type: "text", required: true, wide: true },
      { name: "slug", label: "URL slug", type: "slug" },
      { name: "status", label: "Status", type: "select", options: CONTENT_STATUS },
      { name: "dek", label: "Short intro", type: "textarea", wide: true },
      { name: "heroImageUrl", label: "Large image", type: "image", wide: true },
      { name: "body", label: "Story body", type: "markdown", wide: true },
      { name: "publishedAt", label: "Publish date", type: "date" },
      { name: "place", label: "Place", type: "text" },
      { name: "people", label: "People (one per line)", type: "list" },
      { name: "impact", label: "Impact line", type: "text" },
      { name: "projectId", label: "Related project", type: "relation", relation: { model: "project", label: "title" } },
      { name: "albumId", label: "Photo gallery", type: "relation", relation: { model: "album", label: "title" } },
      { name: "featured", label: "Featured", type: "boolean" },
      ...provenance,
    ],
  },
  {
    key: "events", model: "event", label: "Events", singular: "Event", perm: "events", titleField: "title", slugFrom: "title",
    columns: ["title", "startsAt", "scope", "type", "sourceLabel", "status"], search: ["title", "venue", "organiser"],
    orderBy: [{ startsAt: "desc" }], statusOptions: EVENT_STATUS, publicPath: (r) => (r.status === "APPROVED" ? `/events/${r.slug}` : null),
    help: "Only APPROVED events appear publicly. Imported events arrive as PENDING REVIEW.",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, wide: true },
      { name: "slug", label: "URL slug", type: "slug" },
      { name: "status", label: "Status", type: "select", options: EVENT_STATUS },
      { name: "scope", label: "Shown under", type: "select", options: [["CLUB", "Our events"], ["DISTRICT", "District events"], ["COMMUNITY", "Rotary community events"]] },
      { name: "type", label: "Event type", type: "select", options: [["CLUB_EVENT", "Club event"], ["FELLOWSHIP", "Fellowship"], ["SERVICE_PROJECT", "Service project"], ["DISTRICT_EVENT", "District event"], ["DG_VISIT", "District Governor visit"], ["ROTARY_WIDE", "Rotary-wide event"], ["YOUTH_EVENT", "Youth event"], ["SPECIAL_EVENT", "Special event"]] },
      { name: "startsAt", label: "Starts", type: "datetime", required: true },
      { name: "endsAt", label: "Ends", type: "datetime" },
      { name: "timeTbc", label: "Time to be confirmed", type: "boolean" },
      { name: "allDay", label: "All day", type: "boolean" },
      { name: "description", label: "Description", type: "markdown", wide: true },
      { name: "venue", label: "Venue", type: "text", section: "Place" },
      { name: "location", label: "Location / town", type: "text", section: "Place" },
      { name: "address", label: "Address", type: "text", section: "Place" },
      { name: "latitude", label: "Latitude", type: "number", section: "Place" },
      { name: "longitude", label: "Longitude", type: "number", section: "Place" },
      { name: "organiser", label: "Organiser", type: "text", section: "Details" },
      { name: "imageUrl", label: "Image", type: "image", section: "Details" },
      { name: "registrationUrl", label: "Registration link", type: "url", section: "Details" },
      { name: "featured", label: "Featured", type: "boolean", section: "Details" },
      { name: "sourceLabel", label: "Source", type: "text", section: "Source" },
      { name: "sourceUrl", label: "Source URL", type: "url", section: "Source" },
      { name: "externalId", label: "External ID", type: "text", section: "Source", help: "Set by importers; used to prevent duplicates." },
    ],
  },
  {
    key: "dg-visits", model: "dGVisit", label: "District Governor visits", singular: "DG visit", perm: "dgVisits", titleField: "governorName", slugFrom: "governorName",
    columns: ["governorName", "rotaryYear", "date", "venue", "verification", "status"], search: ["governorName", "venue"],
    orderBy: [{ date: "desc" }], statusOptions: CONTENT_STATUS, publicPath: () => "/district-governor",
    help: "Status (Next / Upcoming / Today / Completed) is calculated automatically from the date.",
    fields: [
      { name: "governorName", label: "Governor's name", type: "text", required: true },
      { name: "rotaryYear", label: "Rotary year", type: "text", required: true, help: "e.g. 2026-27" },
      { name: "slug", label: "URL slug", type: "slug" },
      { name: "status", label: "Status", type: "select", options: CONTENT_STATUS },
      { name: "date", label: "Date & time", type: "datetime", required: true },
      { name: "timeLabel", label: "Time (as displayed)", type: "text", help: "e.g. 3:00 PM" },
      { name: "venue", label: "Venue", type: "text" },
      { name: "eventId", label: "Linked event", type: "relation", relation: { model: "event", label: "title", orderBy: { startsAt: "desc" } } },
      { name: "summary", label: "Summary", type: "textarea", wide: true },
      { name: "story", label: "Story", type: "markdown", wide: true },
      { name: "message", label: "Governor's message / speech notes", type: "textarea", wide: true },
      { name: "projectsHighlighted", label: "Projects highlighted (one per line)", type: "list" },
      { name: "heroImageUrl", label: "Photo", type: "image" },
      { name: "albumId", label: "Album", type: "relation", relation: { model: "album", label: "title" } },
      ...provenance,
    ],
  },
  {
    key: "presidents", model: "president", label: "Presidents", singular: "President", perm: "leadership", titleField: "name",
    columns: ["name", "rotaryYear", "isCurrent", "verification", "status"], search: ["name"], orderBy: [{ rotaryYear: "desc" }], statusOptions: CONTENT_STATUS, publicPath: () => "/leadership",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "rotaryYear", label: "Rotary year", type: "text", required: true, help: "e.g. 2026-27" },
      { name: "isCurrent", label: "Current president", type: "boolean" },
      { name: "status", label: "Status", type: "select", options: CONTENT_STATUS },
      { name: "photoUrl", label: "Photo", type: "image" },
      { name: "memberId", label: "Member record", type: "relation", relation: { model: "member", label: "fullName", orderBy: { fullName: "asc" } } },
      { name: "message", label: "Message", type: "textarea", wide: true },
      { name: "achievements", label: "Major achievements (one per line)", type: "list" },
      { name: "awards", label: "Awards (one per line)", type: "list" },
      { name: "archiveLinks", label: "Archive links (one per line)", type: "list" },
      ...provenance,
    ],
  },
  {
    key: "members", model: "member", label: "Members", singular: "Member", perm: "members", titleField: "fullName",
    columns: ["fullName", "rotaryRole", "status", "email", "phone", "showOnLeadership"], search: ["fullName", "memberNumber", "email", "phone"],
    orderBy: [{ roleOrder: "asc" }, { fullName: "asc" }], statusOptions: ["ACTIVE", "HONORARY", "INACTIVE", "LEFT"],
    help: "The club directory. Email and phone also link a member's Sunday sign-ins to their record. Contact details never appear publicly unless 'Show contact publicly' is ticked.",
    fields: [
      { name: "fullName", label: "Full name", type: "text", required: true },
      { name: "memberNumber", label: "Member ID", type: "text", required: true, help: "Rotary member ID or the club's own number." },
      { name: "status", label: "Membership status", type: "select", options: ["ACTIVE", "HONORARY", "INACTIVE", "LEFT"] },
      { name: "joinDate", label: "Join date", type: "date" },
      { name: "leftAt", label: "Left the club on", type: "date", help: "Set when a member leaves, so past attendance percentages stay accurate." },
      { name: "rotaryRole", label: "Rotary role", type: "text", help: "e.g. Club Secretary" },
      { name: "roleOrder", label: "Order on leadership page", type: "int" },
      { name: "photoUrl", label: "Photo", type: "image" },
      { name: "email", label: "Email (private)", type: "email" },
      { name: "phone", label: "Phone (private)", type: "text" },
      { name: "bio", label: "Short bio", type: "textarea", wide: true },
      { name: "publicProfile", label: "May appear on the public site", type: "boolean", section: "Privacy" },
      { name: "showOnLeadership", label: "Show on leadership board", type: "boolean", section: "Privacy" },
      { name: "showContactPublic", label: "Show contact details publicly", type: "boolean", section: "Privacy" },
      ...provenance,
    ],
  },
  {
    key: "clubs", model: "club", label: "Clubs", singular: "Club", perm: "family", titleField: "name", slugFrom: "name",
    columns: ["name", "type", "isHome", "verification", "status"], search: ["name", "shortName"], orderBy: [{ isHome: "desc" }, { name: "asc" }], statusOptions: CONTENT_STATUS, publicPath: () => "/rotary-family",
    help: "The home club record holds the meeting details, contact email, map pin and logo used across the site.",
    fields: [
      { name: "name", label: "Club name", type: "text", required: true },
      { name: "shortName", label: "Short name (for the family tree)", type: "text" },
      { name: "slug", label: "Slug", type: "slug" },
      { name: "type", label: "Type", type: "select", options: ["ROTARY", "ROTARACT", "INTERACT", "ROTARY_COMMUNITY_CORPS", "OTHER"] },
      { name: "status", label: "Status", type: "select", options: CONTENT_STATUS },
      { name: "district", label: "District", type: "text" },
      { name: "clubNumber", label: "Club ID", type: "text" },
      { name: "charterDate", label: "Charter date", type: "date" },
      { name: "charterDateLabel", label: "Charter date (as displayed)", type: "text" },
      { name: "description", label: "Short description", type: "textarea", wide: true },
      { name: "story", label: "Story", type: "markdown", wide: true },
      { name: "meetingDay", label: "Meeting day", type: "text", section: "Meetings & contact" },
      { name: "meetingTime", label: "Meeting time", type: "text", section: "Meetings & contact" },
      { name: "venue", label: "Venue", type: "text", section: "Meetings & contact" },
      { name: "address", label: "Address", type: "text", section: "Meetings & contact" },
      { name: "latitude", label: "Latitude", type: "number", section: "Meetings & contact" },
      { name: "longitude", label: "Longitude", type: "number", section: "Meetings & contact" },
      { name: "email", label: "Public email", type: "email", section: "Meetings & contact" },
      { name: "website", label: "Website", type: "url", section: "Meetings & contact" },
      { name: "xUrl", label: "X profile URL", type: "url", section: "Meetings & contact" },
      { name: "logoUrl", label: "Official club logo", type: "image", section: "Meetings & contact", help: "Upload the club logo from Rotary Brand Center unchanged. Never a redrawn wheel." },
      ...provenance,
    ],
  },
  {
    key: "relationships", model: "clubRelationship", label: "Club relationships", singular: "Relationship", perm: "family", titleField: "relationshipType",
    columns: ["parentClubId", "relationshipType", "childClubId", "year", "verification", "status"], search: ["description"], orderBy: [{ order: "asc" }], statusOptions: CONTENT_STATUS, publicPath: () => "/rotary-family",
    help: "Describe each relationship precisely: mother club, supported, sponsored, mentored or chartered. Don't assume they're all the same.",
    fields: [
      { name: "parentClubId", label: "Parent / supporting club", type: "relation", required: true, relation: { model: "club", label: "name", orderBy: { name: "asc" } } },
      { name: "relationshipType", label: "Relationship", type: "select", required: true, options: [["MOTHER_CLUB", "Mother club"], ["SUPPORTED", "Supported"], ["SPONSORED", "Sponsored"], ["MENTORED", "Mentored"], ["CHARTERED", "Chartered"]] },
      { name: "childClubId", label: "Child / supported club", type: "relation", required: true, relation: { model: "club", label: "name", orderBy: { name: "asc" } } },
      { name: "year", label: "Year", type: "text" },
      { name: "order", label: "Order", type: "int" },
      { name: "status", label: "Status", type: "select", options: CONTENT_STATUS },
      { name: "description", label: "Short story", type: "textarea", wide: true },
      ...provenance,
    ],
  },
  {
    key: "metrics", model: "impactMetric", label: "Impact metrics", singular: "Metric", perm: "metrics", titleField: "label",
    columns: ["value", "label", "period", "featured", "verification", "status"], search: ["label"], orderBy: [{ order: "asc" }], statusOptions: CONTENT_STATUS, publicPath: () => "/impact",
    help: "Every metric must state the period it covers and its source. Don't present historical numbers as current.",
    fields: [
      { name: "value", label: "Display value", type: "text", required: true, help: "e.g. 600+" },
      { name: "numericValue", label: "Number (for count-up)", type: "int" },
      { name: "label", label: "Label", type: "text", required: true, wide: true },
      { name: "period", label: "Period", type: "text", help: "e.g. Reported July 2025, or Rotary year 2024-25" },
      { name: "category", label: "Impact area", type: "select", options: IMPACT },
      { name: "featured", label: "Show on homepage", type: "boolean" },
      { name: "order", label: "Order", type: "int" },
      { name: "status", label: "Status", type: "select", options: CONTENT_STATUS },
      ...provenance,
    ],
  },
  {
    key: "timeline", model: "timelineEntry", label: "Timeline", singular: "Timeline entry", perm: "timeline", titleField: "title",
    columns: ["dateLabel", "title", "kind", "chapter", "verification", "status"], search: ["title", "description"], orderBy: [{ date: "asc" }], statusOptions: CONTENT_STATUS, publicPath: () => "/our-story",
    fields: [
      { name: "date", label: "Date (for ordering)", type: "date", required: true },
      { name: "dateLabel", label: "Date (as displayed)", type: "text", required: true, help: "e.g. June 2021" },
      { name: "title", label: "Title", type: "text", required: true, wide: true },
      { name: "description", label: "Description", type: "textarea", wide: true },
      { name: "kind", label: "Kind", type: "select", options: ["FORMATION", "CHARTER", "MILESTONE", "PROJECT", "YOUTH_CLUB", "LEADERSHIP", "DG_VISIT", "UPCOMING"] },
      { name: "chapter", label: "Our Story chapter", type: "select", options: [["where-we-started", "Where we started"], ["how-we-grew", "How we grew"], ["what-we-learned", "What we learned"], ["where-we-are-going", "Where we are going"]] },
      { name: "imageUrl", label: "Archive photo", type: "image" },
      { name: "linkUrl", label: "Link", type: "text", help: "e.g. /projects/health-outreach" },
      { name: "status", label: "Status", type: "select", options: CONTENT_STATUS },
      ...provenance,
    ],
  },
  {
    key: "sections", model: "siteSection", label: "Page sections", singular: "Section", perm: "sections", titleField: "key",
    columns: ["key", "title", "status"], search: ["key", "title"], orderBy: [{ order: "asc" }], statusOptions: CONTENT_STATUS,
    help: "Editable text blocks. home.hero, home.who and home.join drive the homepage; story.* are the Our Story chapters.",
    fields: [
      { name: "key", label: "Key", type: "text", required: true },
      { name: "status", label: "Status", type: "select", options: CONTENT_STATUS },
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text", wide: true },
      { name: "body", label: "Body", type: "markdown", wide: true },
      { name: "imageUrl", label: "Image", type: "image" },
      { name: "ctaLabel", label: "Button label", type: "text" },
      { name: "ctaHref", label: "Button link", type: "text" },
      { name: "order", label: "Order", type: "int" },
    ],
  },
  {
    key: "announcements", model: "announcement", label: "Announcements", singular: "Announcement", perm: "announcements", titleField: "title",
    columns: ["title", "audience", "pinned", "expiresAt", "status"], search: ["title", "body"], orderBy: [{ createdAt: "desc" }], statusOptions: CONTENT_STATUS,
    fields: [
      { name: "title", label: "Title", type: "text", required: true, wide: true },
      { name: "body", label: "Message", type: "textarea", wide: true },
      { name: "audience", label: "Audience", type: "select", options: [["members", "Members"], ["public", "Public"]] },
      { name: "pinned", label: "Pinned", type: "boolean" },
      { name: "expiresAt", label: "Expires", type: "datetime" },
      { name: "status", label: "Status", type: "select", options: CONTENT_STATUS },
    ],
  },
  {
    key: "albums", model: "album", label: "Albums", singular: "Album", perm: "media", titleField: "title", slugFrom: "title",
    columns: ["title", "kind", "date", "status"], search: ["title"], orderBy: [{ date: "desc" }], statusOptions: CONTENT_STATUS, publicPath: (r) => `/gallery/${r.slug}`,
    fields: [
      { name: "title", label: "Title", type: "text", required: true, wide: true },
      { name: "slug", label: "Slug", type: "slug" },
      { name: "kind", label: "Kind", type: "select", options: ["PROJECT", "DG_VISIT", "FELLOWSHIP", "LEADERSHIP", "EVENT", "ARCHIVE", "GENERAL"] },
      { name: "date", label: "Date", type: "date" },
      { name: "status", label: "Status", type: "select", options: CONTENT_STATUS },
      { name: "description", label: "Description", type: "textarea", wide: true },
      { name: "coverUrl", label: "Cover image", type: "image" },
      { name: "sourceLabel", label: "Source / credit", type: "text" },
      { name: "sourceUrl", label: "Source URL", type: "url" },
    ],
  },
  {
    key: "media", model: "media", label: "Media items", singular: "Media item", perm: "media", titleField: "alt",
    columns: ["url", "alt", "albumId", "credit", "status"], search: ["alt", "caption"], orderBy: [{ createdAt: "desc" }], statusOptions: CONTENT_STATUS,
    fields: [
      { name: "url", label: "File", type: "image", required: true, wide: true },
      { name: "alt", label: "Alt text (describe what is visible)", type: "text", wide: true, required: true },
      { name: "caption", label: "Caption", type: "text", wide: true },
      { name: "credit", label: "Photo credit", type: "text" },
      { name: "crop", label: "Editorial crop", type: "select", options: ["wide", "portrait", "square", "full"] },
      { name: "albumId", label: "Album", type: "relation", relation: { model: "album", label: "title" } },
      { name: "order", label: "Order in album", type: "int" },
      { name: "status", label: "Status", type: "select", options: CONTENT_STATUS },
      { name: "sourceUrl", label: "Source URL", type: "url" },
    ],
  },
  {
    key: "sponsors", model: "sponsor", label: "Sponsors", singular: "Sponsor", perm: "projects", titleField: "name",
    columns: ["name", "url", "order", "status"], search: ["name"], orderBy: [{ order: "asc" }, { name: "asc" }], statusOptions: CONTENT_STATUS, publicPath: () => "/#sponsors-h",
    help: "Shown on the homepage. Upload a logo for a cleaner look; without one, the name is shown.",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, wide: true },
      { name: "url", label: "Website", type: "url" },
      { name: "status", label: "Status", type: "select", options: CONTENT_STATUS },
      { name: "logoUrl", label: "Logo", type: "image", wide: true },
      { name: "description", label: "Short note (optional)", type: "textarea", wide: true },
      { name: "order", label: "Order", type: "int" },
    ],
  },
  {
    key: "press", model: "pressMention", label: "Media appearances", singular: "Media appearance", perm: "stories", titleField: "title",
    columns: ["title", "outlet", "kind", "date", "status"], search: ["title", "outlet"], orderBy: [{ date: "desc" }], statusOptions: CONTENT_STATUS, publicPath: () => "/#press-h",
    help: "Newspaper articles, TV and radio features. Link to the original — never copy the article itself.",
    fields: [
      { name: "title", label: "Headline (as published)", type: "text", required: true, wide: true },
      { name: "titleEnglish", label: "English translation (if not in English)", type: "text", wide: true },
      { name: "outlet", label: "Outlet", type: "text", required: true, help: "e.g. Bukedde, New Vision, Top TV" },
      { name: "url", label: "Link", type: "url", required: true },
      { name: "kind", label: "Type", type: "select", options: [["article", "Article"], ["video", "Video / TV"], ["radio", "Radio"]] },
      { name: "language", label: "Language", type: "text" },
      { name: "date", label: "Date", type: "date" },
      { name: "status", label: "Status", type: "select", options: CONTENT_STATUS },
      { name: "summary", label: "One-line summary", type: "textarea", wide: true },
      { name: "imageUrl", label: "Image", type: "image" },
      { name: "order", label: "Order", type: "int" },
    ],
  },
];

export const getResource = (key: string) => RESOURCES.find((r) => r.key === key);
