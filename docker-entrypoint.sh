#!/bin/sh
set -e
echo "[entrypoint] applying database migrations…"
/opt/prisma/node_modules/.bin/prisma migrate deploy --schema ./prisma/schema.prisma

if [ "${SEED_ON_START:-true}" = "true" ]; then
  # Idempotent: creates the verified starter content once and never overwrites admin edits.
  echo "[entrypoint] seeding starter content (safe to repeat)…"
  node dist/prisma/seed.js
fi

exec "$@"
