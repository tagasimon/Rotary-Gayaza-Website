import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/time";
import { localParts } from "@/lib/time";
import { AttendForm } from "./AttendForm";

export const metadata: Metadata = { title: "Fellowship sign-in", description: "Sign in to today's Rotary Club of Gayaza fellowship.", robots: { index: false } };

export default async function AttendPage() {
  const now = new Date();
  const start = new Date(`${localParts(now).ymd}T00:00:00+03:00`);
  const end = new Date(start.getTime() + 864e5);
  const [meeting, event] = await Promise.all([
    db.meeting.findFirst({ where: { date: { gte: start, lt: end } }, orderBy: { date: "asc" } }),
    db.event.findFirst({ where: { status: "APPROVED", scope: "CLUB", startsAt: { gte: start, lt: end } }, orderBy: [{ featured: "desc" }, { startsAt: "asc" }] }),
  ]);
  const sunday = new Date(`${localParts(now).ymd}T12:00:00+03:00`).getUTCDay() === 0;
  const title = meeting?.title ?? event?.title ?? (sunday ? "Sunday fellowship" : "Club gathering");
  return (
    <div className="pb-10">
      <p className="eyebrow text-azure">Sign in · {formatDate(now, "day")}</p>
      <h1 className="mt-2 text-[1.9rem] leading-tight text-royal">{title.replace(/[.:]$/, "")}.</h1>
      <p className="mt-2 font-sans text-sm text-muted">Welcome to the Rotary Club of Gayaza. It takes less than a minute.</p>
      <div className="mt-8"><AttendForm /></div>
    </div>
  );
}
