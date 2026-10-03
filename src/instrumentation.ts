// Background discovery scheduler (Node.js runtime only). Disable with INGEST_ENABLED=false and use
// the /api/cron/ingest endpoint or a Coolify scheduled task (`node dist/scripts/ingest.js`) instead.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }
}
