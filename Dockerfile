# syntax=docker/dockerfile:1.7
# Rotary Club of Gayaza — production image (Next.js standalone + Prisma)
ARG NODE_VERSION=22-bookworm-slim

FROM node:${NODE_VERSION} AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NEXT_TELEMETRY_DISABLED=1

# ── dependencies ──
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

# ── build ──
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build-time placeholders only; real values are injected at runtime.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    APP_URL="http://localhost:3000"
RUN npm run build

# ── Prisma CLI for migrations at start-up (kept separate so the runtime stays small) ──
FROM base AS migrator
WORKDIR /opt/prisma
COPY package.json /tmp/package.json
RUN PRISMA_VERSION=$(node -p "require('/tmp/package.json').devDependencies.prisma.replace(/^[^0-9]*/, '')") \
 && npm init -y >/dev/null && npm install --omit=dev --no-audit --no-fund "prisma@${PRISMA_VERSION}"

# ── runtime ──
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 STORAGE_LOCAL_DIR=/app/uploads
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs \
 && apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=migrator --chown=nextjs:nodejs /opt/prisma /opt/prisma
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh && mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads

USER nextjs
EXPOSE 3000
VOLUME ["/app/uploads"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 CMD curl -fsS http://127.0.0.1:3000/api/health || exit 1
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
