"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { storeFile, deleteStored } from "@/lib/storage";
import { audit } from "@/lib/audit";
import { invalidateContent } from "@/lib/cache";

export async function uploadMedia(_: { error?: string; ok?: number }, form: FormData): Promise<{ error?: string; ok?: number }> {
  const u = await requireAdmin("media");
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { error: "Choose at least one file." };
  const albumId = String(form.get("albumId") ?? "") || null;
  const credit = String(form.get("credit") ?? "").trim() || null;
  let order = albumId ? await db.media.count({ where: { albumId } }) : 0;
  const errors: string[] = [];
  let n = 0;
  for (const f of files.slice(0, 40)) {
    try {
      const s = await storeFile(f, "media");
      await db.media.create({ data: { url: s.url, storageKey: s.key, mimeType: f.type, kind: f.type.startsWith("image/") ? "image" : f.type === "application/pdf" ? "document" : "video", albumId, order: order++, credit, alt: f.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " "), createdById: u.id } });
      n++;
    } catch (e) { errors.push(`${f.name}: ${(e as Error).message}`); }
  }
  await audit(u, "upload", "Media", null, `Uploaded ${n} file(s)`);
  invalidateContent();
  revalidatePath("/admin/media");
  return errors.length ? { error: errors.join("; "), ok: n } : { ok: n };
}

export async function deleteMedia(id: string) {
  const u = await requireAdmin("media");
  const m = await db.media.delete({ where: { id } });
  await deleteStored(m.storageKey);
  await audit(u, "delete", "Media", id, m.url);
  invalidateContent();
  revalidatePath("/admin/media");
}
