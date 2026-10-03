import type { Permission } from "@/lib/permissions";

type Item = { href: string; label: string; perm: Permission | null };

/** Everyday items stay visible; the rest sit under "More" so the menu stays short. */
export const ADMIN_NAV: { group: string; collapsed?: boolean; items: Item[] }[] = [
  { group: "", items: [
    { href: "/admin", label: "Dashboard", perm: null },
    { href: "/admin/attendance", label: "Attendance", perm: "attendance" },
    { href: "/admin/content/events", label: "Events", perm: "events" },
    { href: "/admin/content/projects", label: "Projects", perm: "projects" },
    { href: "/admin/content/stories", label: "News & stories", perm: "stories" },
    { href: "/admin/content/press", label: "Media appearances", perm: "stories" },
    { href: "/admin/content/sponsors", label: "Sponsors", perm: "projects" },
    { href: "/admin/media", label: "Photos", perm: "media" },
    { href: "/admin/inbox", label: "Discovered online", perm: "inbox" },
  ] },
  { group: "More", collapsed: true, items: [
    { href: "/admin/content/members", label: "Members & board", perm: "members" },
    { href: "/admin/content/presidents", label: "Presidents", perm: "leadership" },
    { href: "/admin/content/clubs", label: "Clubs (family)", perm: "family" },
    { href: "/admin/content/relationships", label: "Club relationships", perm: "family" },
    { href: "/admin/content/dg-visits", label: "Governor's visits", perm: "dgVisits" },
    { href: "/admin/content/metrics", label: "Impact numbers", perm: "metrics" },
    { href: "/admin/content/timeline", label: "Timeline", perm: "timeline" },
    { href: "/admin/content/sections", label: "Page text", perm: "sections" },
    { href: "/admin/content/announcements", label: "Announcements", perm: "announcements" },
    { href: "/admin/sources", label: "Import sources", perm: "sources" },
    { href: "/admin/messages", label: "Contact messages", perm: "messages" },
    { href: "/admin/users", label: "Admin users", perm: "users" },
    { href: "/admin/audit", label: "Audit log", perm: "audit" },
  ] },
];
