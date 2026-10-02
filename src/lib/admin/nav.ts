import type { Permission } from "@/lib/permissions";

export const ADMIN_NAV: { group: string; items: { href: string; label: string; perm: Permission | null }[] }[] = [
  { group: "Overview", items: [
    { href: "/admin", label: "Dashboard", perm: null },
    { href: "/admin/inbox", label: "Discovered online", perm: "inbox" },
  ] },
  { group: "Attendance", items: [
    { href: "/admin/meetings", label: "Meetings & QR", perm: "meetings" },
    { href: "/admin/attendance", label: "Attendance analytics", perm: "attendance" },
    { href: "/admin/content/members", label: "Members", perm: "members" },
  ] },
  { group: "Website", items: [
    { href: "/admin/content/projects", label: "Projects", perm: "projects" },
    { href: "/admin/content/stories", label: "Stories", perm: "stories" },
    { href: "/admin/content/events", label: "Events", perm: "events" },
    { href: "/admin/content/dg-visits", label: "DG visits", perm: "dgVisits" },
    { href: "/admin/content/presidents", label: "Presidents", perm: "leadership" },
    { href: "/admin/content/clubs", label: "Clubs (family)", perm: "family" },
    { href: "/admin/content/relationships", label: "Club relationships", perm: "family" },
    { href: "/admin/content/metrics", label: "Impact metrics", perm: "metrics" },
    { href: "/admin/content/timeline", label: "Timeline", perm: "timeline" },
    { href: "/admin/content/sections", label: "Page sections", perm: "sections" },
    { href: "/admin/content/announcements", label: "Announcements", perm: "announcements" },
    { href: "/admin/media", label: "Media library", perm: "media" },
  ] },
  { group: "Operations", items: [
    { href: "/admin/sources", label: "Sources & import", perm: "sources" },
    { href: "/admin/messages", label: "Contact messages", perm: "messages" },
    { href: "/admin/users", label: "Admin users", perm: "users" },
    { href: "/admin/audit", label: "Audit log", perm: "audit" },
  ] },
];
