"use server";
import { z } from "zod";
import { clientIp } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { recordCheckIn } from "@/lib/attendance";
import { formatDate, formatTime } from "@/lib/time";

export type AttendState = { ok?: boolean; duplicate?: boolean; name?: string; meeting?: string; when?: string; error?: string };

const schema = z.object({
  status: z.enum(["member", "guest"], { message: "Tell us whether you are a member or a guest." }),
  affiliation: z.enum(["ROTARIAN", "ROTARACTOR"], { message: "Choose Rotarian or Rotaractor." }).optional(),
  club: z.string().trim().max(160).optional(),
  name: z.string().trim().min(2, "Please enter your full name.").max(120),
  email: z.string().trim().max(160).refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "That email address doesn't look right.").optional(),
  phone: z.string().trim().max(30).refine((v) => !v || v.replace(/\D/g, "").length >= 9, "That phone number looks too short.").optional(),
});

export async function signIn(_: AttendState, form: FormData): Promise<AttendState> {
  if (form.get("website")) return { ok: true };
  if (!rateLimit(`attend:${await clientIp()}`, 40, 60 * 60e3).ok) return { error: "Too many sign-ins from this connection. Please try again shortly." };
  const parsed = schema.safeParse(Object.fromEntries(["status", "affiliation", "club", "name", "email", "phone"].map((k) => [k, String(form.get(k) ?? "") || undefined])));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  if (!v.email && !v.phone) return { error: "Please give an email address or a phone number." };
  if (v.status === "guest" && !v.affiliation) return { error: "Choose Rotarian or Rotaractor." };
  if (v.status === "guest" && !v.club) return { error: "Please choose (or type) your club." };
  // Members of RC Gayaza are Rotarians, so members aren't asked.
  const affiliation = v.status === "member" ? "ROTARIAN" : v.affiliation!;
  const { meeting, duplicate } = await recordCheckIn({
    name: v.name, email: v.email ?? "", phone: v.phone ?? "", isGuest: v.status === "guest", affiliation, clubName: v.status === "guest" ? v.club! : null,
  });
  return { ok: true, duplicate, name: v.name.split(" ")[0], meeting: meeting.title, when: `${formatDate(meeting.date, "day")} · ${formatTime(new Date())}` };
}
