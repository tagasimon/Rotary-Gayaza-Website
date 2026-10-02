import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { db } from "./db";
import { can, type Permission } from "./permissions";

export const ADMIN_COOKIE = "rcg_admin";
export const MEMBER_COOKIE = "rcg_member";
const ADMIN_TTL_DAYS = 7;
const MEMBER_TTL_DAYS = Number(process.env.MEMBER_SESSION_DAYS || 180); // "remember this phone"

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");

export const hashSecret = (s: string) => bcrypt.hash(s, 11);
export const verifySecret = (s: string, hash: string) => bcrypt.compare(s, hash);

const secure = () => (process.env.APP_URL || "").startsWith("https://");

async function createSession(kind: "admin" | "member", owner: { userId?: string; memberId?: string }) {
  const token = randomToken();
  const days = kind === "admin" ? ADMIN_TTL_DAYS : MEMBER_TTL_DAYS;
  const expiresAt = new Date(Date.now() + days * 864e5);
  const ua = (await headers()).get("user-agent")?.slice(0, 200) ?? null;
  await db.session.create({ data: { tokenHash: sha256(token), kind, ...owner, expiresAt, userAgent: ua } });
  (await cookies()).set(kind === "admin" ? ADMIN_COOKIE : MEMBER_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: secure(), path: "/", expires: expiresAt,
  });
}

export const createAdminSession = (userId: string) => createSession("admin", { userId });
export const createMemberSession = (memberId: string) => createSession("member", { memberId });

async function readSession(kind: "admin" | "member") {
  const token = (await cookies()).get(kind === "admin" ? ADMIN_COOKIE : MEMBER_COOKIE)?.value;
  if (!token) return null;
  const s = await db.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true, member: true },
  });
  if (Math.random() < 0.01) db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});
  if (!s || s.kind !== kind || s.expiresAt < new Date()) return null;
  if (Date.now() - s.lastSeenAt.getTime() > 3600e3) {
    db.session.update({ where: { id: s.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
  }
  return s;
}

export async function destroySession(kind: "admin" | "member") {
  const jar = await cookies();
  const name = kind === "admin" ? ADMIN_COOKIE : MEMBER_COOKIE;
  const token = jar.get(name)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: sha256(token) } });
  jar.delete(name);
}

export type AdminUser = { id: string; name: string; email: string; role: Role };

export async function getAdmin(): Promise<AdminUser | null> {
  const s = await readSession("admin");
  if (!s?.user || !s.user.active) return null;
  const { id, name, email, role } = s.user;
  return { id, name, email, role };
}

export async function requireAdmin(perm?: Permission): Promise<AdminUser> {
  const u = await getAdmin();
  if (!u) redirect("/admin/login");
  if (perm && !can(u.role, perm)) redirect("/admin?denied=" + perm);
  return u;
}

export async function getMember() {
  const s = await readSession("member");
  if (!s?.member) return null;
  if (s.member.status === "LEFT" || s.member.status === "INACTIVE") return null;
  return s.member;
}

export async function requireMember() {
  const m = await getMember();
  if (!m) redirect("/member/login");
  return m;
}

/**
 * Client IP for rate limiting. Behind Coolify/Traefik the proxy sets X-Real-Ip and appends the
 * real peer to X-Forwarded-For, so we trust X-Real-Ip, else the RIGHT-most XFF hop (client-supplied
 * entries are on the left and can be spoofed).
 */
export async function clientIp() {
  const h = await headers();
  const xff = h.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean);
  return (h.get("x-real-ip") || xff?.[xff.length - 1] || "unknown").trim();
}

let dummyHash: Promise<string> | null = null;
/** Equalises timing for unknown accounts so login responses don't reveal which accounts exist. */
export function burnTime(secret: string) {
  dummyHash ??= bcrypt.hash("timing-equaliser", 11);
  return dummyHash.then((h) => bcrypt.compare(secret, h));
}

/** Member PIN check with lockout (5 failures → 15 minutes). */
export async function verifyMemberPin(memberNumber: string, pin: string) {
  const member = await db.member.findFirst({
    where: { memberNumber: { equals: memberNumber.trim(), mode: "insensitive" } },
  });
  const generic = { ok: false as const, error: "We couldn't match that member number and PIN." };
  if (!member || !member.pinHash) { await burnTime(pin); return generic; }
  if (member.pinLockedUntil && member.pinLockedUntil > new Date()) { await burnTime(pin); return generic; }
  const good = await verifySecret(pin.trim(), member.pinHash);
  if (!good) {
    // atomic increment: parallel guesses can't all read the same counter
    const { failedPinAttempts } = await db.member.update({ where: { id: member.id }, data: { failedPinAttempts: { increment: 1 } }, select: { failedPinAttempts: true } });
    if (failedPinAttempts >= 5) await db.member.update({ where: { id: member.id }, data: { failedPinAttempts: 0, pinLockedUntil: new Date(Date.now() + 15 * 60e3) } });
    return generic;
  }
  if (member.status === "LEFT" || member.status === "INACTIVE")
    return { ok: false as const, error: "This membership is not active. Please speak to the club secretary." };
  if (member.failedPinAttempts) await db.member.update({ where: { id: member.id }, data: { failedPinAttempts: 0, pinLockedUntil: null } });
  return { ok: true as const, member };
}
