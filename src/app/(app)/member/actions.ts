"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyMemberPin, createMemberSession, requireMember, hashSecret, verifySecret, clientIp } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export type FormState = { error?: string; ok?: boolean };

export async function memberLogin(_: FormState, form: FormData): Promise<FormState> {
  const ip = await clientIp();
  if (!rateLimit(`mlogin:${ip}`, 20, 15 * 60e3).ok) return { error: "Too many attempts. Try again in 15 minutes." };
  const v = await verifyMemberPin(String(form.get("memberNumber") ?? ""), String(form.get("pin") ?? ""));
  if (!v.ok) return { error: v.error };
  await createMemberSession(v.member.id);
  const next = String(form.get("next") ?? "/member");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/member");
}

export async function changePin(_: FormState, form: FormData): Promise<FormState> {
  const m = await requireMember();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  if (!/^\d{4,8}$/.test(next)) return { error: "Your new PIN must be 4–8 digits." };
  if (next !== confirm) return { error: "The two new PINs don't match." };
  if (/^(\d)\1+$/.test(next) || "0123456789".includes(next) || "9876543210".includes(next)) return { error: "Choose a PIN that is harder to guess." };
  const row = await db.member.findUniqueOrThrow({ where: { id: m.id } });
  if (!row.pinHash || !(await verifySecret(current, row.pinHash))) return { error: "Your current PIN is not correct." };
  await db.member.update({ where: { id: m.id }, data: { pinHash: await hashSecret(next), pinSetAt: new Date() } });
  return { ok: true };
}
