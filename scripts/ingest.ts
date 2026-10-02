/** CLI: `npm run ingest` (dev) or `node dist/ingest.js` (Docker / Coolify scheduled task). */
import { runIngestion } from "@/lib/ingest/run";
import { db } from "@/lib/db";

runIngestion("cli", process.argv[2])
  .then((r) => { console.log(JSON.stringify(r, null, 2)); })
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => db.$disconnect());
