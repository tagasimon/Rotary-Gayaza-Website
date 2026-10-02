import { timingSafeEqual } from "node:crypto";
import { runIngestion } from "@/lib/ingest/run";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// POST /api/cron/ingest  with header  Authorization: Bearer $CRON_SECRET
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const got = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!secret || got.length !== secret.length || !timingSafeEqual(Buffer.from(got), Buffer.from(secret))) return new Response("Unauthorized", { status: 401 });
  return Response.json(await runIngestion("cron-endpoint"));
}
