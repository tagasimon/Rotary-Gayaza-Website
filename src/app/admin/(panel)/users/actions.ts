"use server";
import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { requireAdmin, hashSecret, verifySecret } from "@/lib/auth";
import { audit } from "@/lib/audit";
import type { Role } from "@prisma/client";
import { ROLE_LABEL } from "@/lib/permissions";

export type U = { error?: string; password?: string; ok?: boolean };

export async function createUser(_: U, form: FormData): Promise<U> {
  const me = await requireAdmin("users");
  const email = String(form.get("email") ?? "").toLowerCase().trim();
  const name = String(form.get("name") ?? "").trim();
  const role = String(form.get("role") ?? "EDITOR") as Role;
  if (!Object.keys(ROLE_LABEL).includes(role)) return { error: "Choose a valid role." };
  if (!email.includes("@") || !name) return { error: "Name and email are required." };
  if (await db.user.findUnique({ where: { email } })) return { error: "A user with that email exists." };
  const password = randomBytes(12).toString("base64url");
  const u = await db.user.create({ data: { email, name, role, passwordHash: await hashSecret(password) } });
  await audit(me, "create", "User", u.id, `Created ${role} ${email}`);
  revalidatePath("/admin/users");
  return { password };
}

export async function updateUser(id: string, form: FormData) {
  const me = await requireAdmin("users");
  const role = String(form.get("role")) as Role;
  if (!Object.keys(ROLE_LABEL).includes(role)) return;
  const active = form.get("active") === "on";
  if (id === me.id && (role !== "SUPER_ADMIN" || !active)) return; // can't demote or lock yourself out
  await db.user.update({ where: { id }, data: { role, active } });
  if (!active) await db.session.deleteMany({ where: { userId: id } });
  await audit(me, "update", "User", id, `role=${role}, active=${active}`);
  revalidatePath("/admin/users");
}

export async function resetPassword(id: string): Promise<string> {
  const me = await requireAdmin("users");
  const password = randomBytes(12).toString("base64url");
  await db.user.update({ where: { id }, data: { passwordHash: await hashSecret(password), failedLogins: 0, lockedUntil: null } });
  await db.session.deleteMany({ where: { userId: id } });
  await audit(me, "reset-password", "User", id);
  return password;
}

export async function changeOwnPassword(_: U, form: FormData): Promise<U> {
  const me = await requireAdmin();
  const cur = String(form.get("current") ?? ""), next = String(form.get("next") ?? "");
  if (next.length < 10) return { error: "Use at least 10 characters." };
  const row = await db.user.findUniqueOrThrow({ where: { id: me.id } });
  if (!(await verifySecret(cur, row.passwordHash))) return { error: "Current password is incorrect." };
  await db.user.update({ where: { id: me.id }, data: { passwordHash: await hashSecret(next) } });
  await audit(me, "change-password", "User", me.id);
  return { ok: true };
}
