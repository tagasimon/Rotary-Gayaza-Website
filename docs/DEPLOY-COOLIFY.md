# Deploying on Coolify

These steps assume Coolify v4 on a VPS with at least 1 vCPU and 2 GB RAM. The build is the heaviest step; at runtime the app uses about 150–250 MB of RAM.

## Option A: Dockerfile app + Coolify PostgreSQL (recommended)

1. **Database.** Go to *Project → + New → Database → PostgreSQL 16*. Start it, then copy its **Postgres URL (internal)**, which looks like `postgres://user:pass@<uuid>:5432/postgres`. Turn on scheduled backups for it.
2. **Application.** Go to *+ New → Public/Private Repository*, choose this repo, and pick the **Dockerfile** build pack.
   * Ports exposed: `3000`
   * Health check path: `/api/health` (the image also has its own Docker `HEALTHCHECK`)
3. **Environment variables** (*Environment Variables* tab). See `.env.example` for the full list.
   ```
   DATABASE_URL=<internal Postgres URL>?schema=public
   APP_URL=https://rotarygayaza.org
   AUTH_SECRET=<openssl rand -base64 48>
   SEED_ADMIN_EMAIL=you@club.org          # first deploy only
   SEED_ADMIN_PASSWORD=<long password>    # first deploy only
   CRON_SECRET=<random>                   # optional
   ```
   Uncheck "Build Variable" for secrets. The image doesn't need any build-time variables.
4. **Persistent storage.** Under *Storages*, add a volume mounted at **`/app/uploads`**, which is where uploaded photos and documents go. Alternatively, set `STORAGE_DRIVER=s3` and the `S3_*` variables to use MinIO (Coolify has a one-click MinIO service), R2 or Backblaze.
5. **Domain.** Set `https://rotarygayaza.org` (plus `www.` if you want it) under *Domains*. Coolify issues the TLS certificate.
6. **Deploy.** On start, the container:
   * runs `prisma migrate deploy`
   * runs the idempotent seed, which creates the verified starter content and the first admin once and never overwrites edits (`SEED_ON_START=false` turns this off)
   * starts the Next.js server
7. Sign in at `/admin`, **change your password** (*Account*), then remove `SEED_ADMIN_PASSWORD` from the environment variables.

## Option B: Docker Compose (app + database in one resource)

Choose *+ New → Docker Compose* and point it at this repo's `docker-compose.yml`. Set `POSTGRES_PASSWORD`, `APP_URL` and `AUTH_SECRET` (plus the seed admin variables) in Coolify's environment UI. Coolify keeps the named volumes (`pgdata`, `uploads`) between deploys.

## Scheduled discovery

The app checks District 9213 and Rotary-O every 12 hours by itself (`INGEST_ENABLED=true`). If you run more than one replica, or prefer Coolify to schedule it:

* Set `INGEST_ENABLED=false`, then
* add a *Scheduled Task* on the app with the command `node dist/scripts/ingest.js` and the frequency `0 */12 * * *`, **or**
* call `curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://rotarygayaza.org/api/cron/ingest` from any scheduler.

## Admin users from the terminal

In Coolify open *Terminal* on the app container and run:

```sh
node dist/scripts/create-admin.js --email secretary@club.org --name "Club Secretary" --role ADMIN
```

This prints a temporary password. Running it again for an existing email resets that user's password.

## Backups

* **Database:** Coolify's PostgreSQL scheduled backups (S3-compatible destination recommended).
* **Uploads:** back up the `/app/uploads` volume, or use S3 storage that has its own versioning.

## Updating

Push to the deploy branch, or click *Redeploy*. New migrations are applied automatically on start, and the seed never overwrites content edited in the admin.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Health check fails, logs show `P1001` | `DATABASE_URL` is wrong or the database isn't reachable from the app's network |
| QR codes point to `localhost` | Set `APP_URL` to the public https URL and redeploy |
| Members are logged out on every visit | `APP_URL` must start with `https://` behind Coolify's proxy, so cookies are marked secure |
| Uploaded photos disappear after a redeploy | Mount a persistent volume at `/app/uploads` |
| Images from a new external host don't load | Add the host to `IMAGE_REMOTE_HOSTS` |
| District import shows "HTTP 403" | The district site sometimes blocks unknown clients. The importer sends a browser-style user agent; try *Run now* again later. The rest of the site is unaffected |
