import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { LOCAL_DIR, MIME_BY_EXT } from "@/lib/storage";

// Serves locally-stored uploads (STORAGE_DRIVER=local). Path traversal is blocked.
export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const rel = (await params).path.join("/");
  const root = LOCAL_DIR();
  const full = path.resolve(root, rel);
  if (!full.startsWith(root + path.sep)) return new Response("Not found", { status: 404 });
  try {
    const s = await stat(full);
    if (!s.isFile()) throw new Error();
    const ext = path.extname(full).slice(1).toLowerCase();
    const body = await readFile(full);
    return new Response(body, { headers: { "Content-Type": MIME_BY_EXT[ext] ?? "application/octet-stream", "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff", "Content-Length": String(s.size), ...(ext === "svg" ? { "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'" } : {}) } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
