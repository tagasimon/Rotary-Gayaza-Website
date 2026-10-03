import { runIngestion } from "./lib/ingest/run";

if (process.env.INGEST_ENABLED !== "false" && process.env.NODE_ENV === "production") {
  const hours = Math.max(1, Number(process.env.INGEST_INTERVAL_HOURS || 12));
  const go = () => runIngestion("schedule").catch((e) => console.error("[ingest]", e));
  setTimeout(go, 3 * 60e3);
  setInterval(go, hours * 3600e3);
  console.log(`[ingest] scheduled every ${hours}h`);
}
