// Background discovery scheduler (single-process). Disable with INGEST_ENABLED=false and use the
// /api/cron/ingest endpoint or a Coolify scheduled task (`node dist/ingest.js`) instead.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.INGEST_ENABLED === "false" || process.env.NODE_ENV !== "production") return;
  const hours = Math.max(1, Number(process.env.INGEST_INTERVAL_HOURS || 12));
  const { runIngestion } = await import("./lib/ingest/run");
  const go = () => runIngestion("schedule").catch((e) => console.error("[ingest]", e));
  setTimeout(go, 3 * 60e3);
  setInterval(go, hours * 3600e3);
  console.log(`[ingest] scheduled every ${hours}h`);
}
