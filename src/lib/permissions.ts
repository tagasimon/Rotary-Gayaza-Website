import type { Role } from "@prisma/client";

export type Permission =
  | "users" | "audit" | "settings"
  | "members" | "attendance" | "meetings"
  | "events" | "projects" | "stories" | "media" | "dgVisits" | "leadership"
  | "family" | "metrics" | "timeline" | "sections" | "announcements"
  | "inbox" | "sources" | "messages";

const ALL: Permission[] = [
  "users", "audit", "settings", "members", "attendance", "meetings", "events", "projects", "stories", "media",
  "dgVisits", "leadership", "family", "metrics", "timeline", "sections", "announcements", "inbox", "sources", "messages",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: ALL,
  // events, projects, members, attendance, content
  ADMIN: ALL.filter((p) => p !== "users" && p !== "settings"),
  // stories, projects, events, media
  EDITOR: ["events", "projects", "stories", "media", "dgVisits", "inbox"],
  // meetings + attendance only
  ATTENDANCE_MANAGER: ["meetings", "attendance"],
};

export function can(role: Role | undefined | null, perm: Permission) {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(perm);
}

export const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: "Super admin",
  ADMIN: "Admin",
  EDITOR: "Editor",
  ATTENDANCE_MANAGER: "Attendance manager",
};
