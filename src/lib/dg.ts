import { sameLocalDay } from "./time";

export type VisitStatus = "TODAY" | "NEXT" | "UPCOMING" | "COMPLETED";

/** NEXT = the soonest future visit; TODAY = same local day; UPCOMING = later future visits; COMPLETED = past. */
export function visitStatuses<T extends { id: string; date: Date }>(visits: T[], now = new Date()) {
  const out = new Map<string, VisitStatus>();
  const future = visits.filter((v) => v.date >= now || sameLocalDay(v.date, now)).sort((a, b) => +a.date - +b.date);
  let nextAssigned = false;
  for (const v of visits) {
    if (sameLocalDay(v.date, now)) { out.set(v.id, "TODAY"); nextAssigned = true; continue; }
  }
  for (const v of future) {
    if (out.has(v.id)) continue;
    if (!nextAssigned) { out.set(v.id, "NEXT"); nextAssigned = true; } else out.set(v.id, "UPCOMING");
  }
  for (const v of visits) if (!out.has(v.id)) out.set(v.id, "COMPLETED");
  return out;
}

export const STATUS_LABEL: Record<VisitStatus, string> = {
  TODAY: "Today", NEXT: "Next visit", UPCOMING: "Upcoming", COMPLETED: "Completed",
};
