"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, hashSecret } from "@/lib/auth";
import { getResource } from "@/lib/admin/resources";
import { parseForm } from "@/lib/admin/parse";
import { audit } from "@/lib/audit";
import { invalidateContent } from "@/lib/cache";
import { slugify, normalizeTitle } from "@/lib/slug";
import { toLocalInput } from "@/lib/time";
import { randomInt } from "node:crypto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const delegate = (model: string) => (db as any)[model];

async function uniqueSlug(model: string, base: string, id?: string) {
  let slug = slugify(base);
  for (let i = 2; i < 200; i++) {
    const clash = await delegate(model).findFirst({ where: { slug, ...(id ? { NOT: { id } } : {}) }, select: { id: true } });
    if (!clash) return slug;
    slug = `${slugify(base)}-${i}`;
  }
  return `${slugify(base)}-${Date.now()}`;
}

export type SaveState = { error?: string; saved?: boolean };

export async function saveResource(key: string, id: string | null, _: SaveState, form: FormData): Promise<SaveState> {
  const res = getResource(key);
  if (!res) return { error: "Unknown content type" };
  const user = await requireAdmin(res.perm);
  const { data, errors } = await parseForm(res, form, user.id);
  if (errors.length) return { error: errors.join(" · ") };

  if (res.fields.some((f) => f.type === "slug")) {
    const base = (data.slug as string) || (res.slugFrom ? String(data[res.slugFrom] ?? "") : "") + (key === "dg-visits" && data.date ? `-${toLocalInput(data.date as Date, true).slice(0, 4)}` : "");
    data.slug = await uniqueSlug(res.model, base || "item", id ?? undefined);
  }
  if (key === "events") {
    data.dedupeKey = `${normalizeTitle(String(data.title))}|${toLocalInput(data.startsAt as Date, true)}`;
  }
  if (key === "presidents" && data.isCurrent) await db.president.updateMany({ where: { isCurrent: true, ...(id ? { NOT: { id } } : {}) }, data: { isCurrent: false } });
  if (key === "members" && data.memberNumber) data.memberNumber = String(data.memberNumber).toUpperCase();

  try {
    const m = delegate(res.model);
    const row = id ? await m.update({ where: { id }, data }) : await m.create({ data: { ...data, createdById: user.id } });
    await audit(user, id ? "update" : "create", res.singular, row.id, `${id ? "Updated" : "Created"} ${res.singular.toLowerCase()}: ${String(row[res.titleField] ?? row.id).slice(0, 120)}`);
    invalidateContent();
    revalidatePath("/", "layout");
    if (!id) redirect(`/admin/content/${key}/${row.id}?saved=1`);
    return { saved: true };
  } catch (e) {
    if ((e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw e;
    const msg = (e as Error).message;
    if (msg.includes("Unique constraint")) return { error: "Another record already uses that value (slug, member ID or relationship)." };
    console.error(e);
    return { error: "Could not save. " + msg.split("\n").slice(-1)[0] };
  }
}

export async function deleteResource(key: string, id: string) {
  const res = getResource(key);
  if (!res) return;
  const user = await requireAdmin(res.perm);
  const row = await delegate(res.model).delete({ where: { id } });
  await audit(user, "delete", res.singular, id, `Deleted ${res.singular.toLowerCase()}: ${String(row[res.titleField] ?? id).slice(0, 120)}`);
  invalidateContent();
  revalidatePath("/", "layout");
  redirect(`/admin/content/${key}`);
}

/** Sets a member's attendance PIN. If none is given, generates a 4-digit PIN and returns it once. */
export async function setMemberPin(memberId: string, _: { pin?: string; error?: string }, form: FormData): Promise<{ pin?: string; error?: string }> {
  const user = await requireAdmin("members");
  let pin = String(form.get("pin") ?? "").trim();
  if (pin && !/^\d{4,8}$/.test(pin)) return { error: "PIN must be 4–8 digits." };
  if (!pin) pin = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.member.update({ where: { id: memberId }, data: { pinHash: await hashSecret(pin), pinSetAt: new Date(), failedPinAttempts: 0, pinLockedUntil: null } });
  await db.session.deleteMany({ where: { memberId } });
  await audit(user, "set-pin", "Member", memberId, "Set attendance PIN (existing phone sessions signed out)");
  return { pin };
}
