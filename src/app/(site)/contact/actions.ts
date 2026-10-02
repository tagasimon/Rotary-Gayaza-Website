"use server";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().trim().min(2, "Please tell us your name").max(120),
  email: z.string().trim().email("Please enter a valid email").max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  interest: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().min(5, "Please add a short message").max(4000),
});

export type ContactState = { ok?: boolean; error?: string; fields?: Record<string, string> };

export async function sendContact(_: ContactState, form: FormData): Promise<ContactState> {
  if (form.get("website")) return { ok: true }; // honeypot
  const ip = await clientIp();
  if (!rateLimit(`contact:${ip}`, 5, 3600e3).ok) return { error: "Too many messages from this connection. Please try again later." };
  const raw = Object.fromEntries(["name", "email", "phone", "interest", "message"].map((k) => [k, String(form.get(k) ?? "")]));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields: raw };
  await db.contactMessage.create({ data: { ...parsed.data, phone: parsed.data.phone || null, interest: parsed.data.interest || null, ip } });
  return { ok: true };
}
