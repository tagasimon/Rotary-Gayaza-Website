import "server-only";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

/**
 * Storage abstraction.
 *  STORAGE_DRIVER=local (default) — files under STORAGE_LOCAL_DIR (default ./uploads), served by /media/[...path]
 *  STORAGE_DRIVER=s3 — any S3-compatible bucket (MinIO, Cloudflare R2, Backblaze, AWS)
 */
export interface StoredFile { key: string; url: string; }

const driver = () => (process.env.STORAGE_DRIVER || "local").toLowerCase();
export const LOCAL_DIR = () => path.resolve(process.env.STORAGE_LOCAL_DIR || "./uploads");

const ALLOWED = new Map([
  ["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"], ["image/avif", "avif"], ["image/gif", "gif"],
  ["image/svg+xml", "svg"], ["application/pdf", "pdf"], ["video/mp4", "mp4"],
]);
export const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_MB || 10) * 1024 * 1024;

export async function storeFile(file: File, folder = "media"): Promise<StoredFile> {
  const ext = ALLOWED.get(file.type);
  if (!ext) throw new Error(`File type ${file.type || "unknown"} is not allowed.`);
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("File is too large.");
  const d = new Date();
  const key = `${folder}/${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${randomBytes(8).toString("hex")}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  if (driver() === "s3") {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const s3 = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! },
    });
    await s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key, Body: buf, ContentType: file.type, CacheControl: "public, max-age=31536000, immutable" }));
    const base = (process.env.S3_PUBLIC_URL || "").replace(/\/$/, "");
    return { key, url: `${base}/${key}` };
  }

  const full = path.join(LOCAL_DIR(), key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, buf);
  return { key, url: `/media/${key}` };
}

export async function deleteStored(key: string | null | undefined) {
  if (!key) return;
  try {
    if (driver() === "s3") {
      const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      const s3 = new S3Client({
        region: process.env.S3_REGION || "auto", endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
        credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! },
      });
      await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }));
    } else {
      await unlink(path.join(LOCAL_DIR(), key));
    }
  } catch { /* already gone */ }
}

export const MIME_BY_EXT: Record<string, string> = Object.fromEntries([...ALLOWED].map(([m, e]) => [e, m]));
