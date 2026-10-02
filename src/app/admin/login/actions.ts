"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createAdminSession, verifySecret, clientIp, destroySession, getAdmin, burnTime } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

export async function adminLogin(_: { error?: string }, form: FormData): Promise<{ error?: string }> {
  const ip = await clientIp();
  if (!rateLimit(`alogin:${ip}`, 10, 15 * 60e3).ok) return { error: "Too many attempts. Try again in 15 minutes." };
  const email = String(form.get("email") ?? "").toLowerCase().trim();
  const password = String(form.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  const generic = "Email or password is incorrect.";
  if (!user || !user.active || (user.lockedUntil && user.lockedUntil > new Date())) { await burnTime(password); return { error: generic }; }
  if (!(await verifySecret(password, user.passwordHash))) {
    const { failedLogins } = await db.user.update({ where: { id: user.id }, data: { failedLogins: { increment: 1 } }, select: { failedLogins: true } });
    if (failedLogins >= 8) await db.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: new Date(Date.now() + 30 * 60e3) } });
    return { error: generic };
  }
  await db.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } });
  await createAdminSession(user.id);
  await audit({ id: user.id, name: user.name }, "login", "User", user.id, `Signed in from ${ip}`);
  redirect("/admin");
}

export async function adminLogout() {
  const u = await getAdmin();
  await destroySession("admin");
  if (u) await audit(u, "logout", "User", u.id);
  redirect("/admin/login");
}
