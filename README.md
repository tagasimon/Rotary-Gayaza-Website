# The Rotary Story of Gayaza

Website and lightweight club-management platform for the **Rotary Club of Gayaza** (Rotary District 9213, Uganda).

The public site is an editorial story: roots → people → service → impact → legacy → future. The member and admin tools sit behind sign-in: QR attendance, analytics, a CMS, event aggregation and the Governor's-visit archive.

```
Next.js 15 (App Router, TypeScript) · Tailwind CSS 4 · PostgreSQL + Prisma 6 · Recharts · MapLibre
Self-hosted: Docker / Docker Compose / Coolify. No Firebase, no Vercel-only features, no paid SaaS.
```

---

## What's inside

| Area | Where | Notes |
|---|---|---|
| Homepage | `/` | Hero, next DG visit with countdown, who we are, sourced impact numbers, project stories, **Rotary Family tree**, 2021→today→next timeline, three separate event lists, leadership, stories, get involved |
| Our Story | `/our-story` | Editable chapters (*Where we started / How we grew / What we learned / Where we are going*) and a dated timeline with archive photos |
| Our Impact | `/impact` | Lists only impact areas with documented work. Every metric states its period and source |
| Projects | `/projects`, `/projects/[slug]` | Search plus filters (year, Rotary year, area of focus, location, type, partner, status). Pages are structured as challenge → action → people → result |
| Rotary Family | `/rotary-family` | Interactive network on desktop, vertical lineage on mobile. Relationships are typed: mother club, supported, sponsored, mentored, chartered |
| Events | `/events`, `/events/[slug]` | **Our events / District events / Rotary community**, kept separate. Includes Event schema and a map |
| Governor's Visits | `/district-governor` | NEXT / UPCOMING / TODAY / COMPLETED status is calculated from the date. Includes albums and sources |
| Leadership, People | `/leadership`, `/members` | Contact details appear only when a member opts in |
| Stories of Service | `/stories/[slug]` | Magazine layout, gallery, sharing, source attribution |
| Photographs | `/gallery/[slug]` | Paginated albums, full-screen lightbox |
| Contact | `/contact` | Form (honeypot + rate limit), map, X follow card |
| Attendance | `/attendance/[token]` | Mobile check-in for members and guests. A remembered phone needs one tap |
| Member portal | `/member` | My attendance %, meetings, announcements, upcoming events, change PIN |
| QR scanner | `/scan` | In-browser scanner (BarcodeDetector + jsQR fallback). The phone's own camera also works |
| Admin | `/admin` | Dashboard, meetings & QR, analytics with charts and CSV, members, CMS for every content type, media library, Discovered Online inbox, sources & import, messages, users, audit log |

## Content provenance (read this before editing content)

The site follows the brief's **no-invented-content** rule, and enforces it in the data model:

* Every factual record (project, metric, timeline entry, club, relationship, story, DG visit, president, member) has a `verification` field (`VERIFIED`, `CLUB_RECORD` or `NEEDS_CONFIRMATION`) plus `sourceLabel` and `sourceUrl`.
* Public pages show a **Source ↗** link or the label "Club records".
* The admin dashboard lists **Facts awaiting confirmation**. Each item links to a filtered list.
* Imported content is **never auto-published**. Events arrive as `PENDING_REVIEW`. Stories, albums, DG-visit hints and club mentions go to **Admin → Discovered online**, and approving one creates a *draft*.

`docs/CONTENT-SOURCES.md` lists every seeded fact, its source and what still needs confirming.

## Quick start (local)

```bash
cp .env.example .env            # set DATABASE_URL, APP_URL=http://localhost:3000, AUTH_SECRET
npm install
npx prisma migrate deploy       # or: npx prisma migrate dev
SEED_ADMIN_EMAIL=you@example.org SEED_ADMIN_PASSWORD='a-long-password' npm run db:seed
# optional, to try the analytics with fake data:  SEED_DEMO=true npm run db:seed   (demo PIN 1234, members DEMO-01…)
npm run dev                     # http://localhost:3000 · admin at /admin
```

Or, with Docker:

```bash
cp .env.example .env    # set POSTGRES_PASSWORD, APP_URL, AUTH_SECRET, SEED_ADMIN_EMAIL/PASSWORD
docker compose up -d --build
```

## Deploying on Coolify

See **[docs/DEPLOY-COOLIFY.md](docs/DEPLOY-COOLIFY.md)**. In short: create a PostgreSQL resource, deploy this repo with the Dockerfile build pack on port 3000, set the environment variables, mount a volume at `/app/uploads` and add your domain. On every start the container runs migrations and the idempotent seed, and it has a Docker health check on `/api/health`.

## How attendance works

1. **Admin → Meetings & QR → "+ Next Sunday's meeting"** (or create any meeting).
2. **Generate QR code** for an attendance window (for example 4:30 PM → 6:30 PM).
3. **Show QR on projector** opens a full-screen view with a live count. A printable sheet is also available.
4. The member scans with their phone camera. The page opens and shows the meeting, today's date and time, and the attendance state.
5. **First time:** member ID + PIN, with "Remember this phone" ticked. **After that:** one tap, "I'm here". The end-to-end test measured about 3 seconds.
6. The record is stored once per member per meeting, enforced by a database unique constraint. Re-scanning shows "Already checked in".

Security: each session token is 256-bit random and tied to one meeting. It expires when the window closes, an admin can revoke it, and opening a new window revokes the old code. PINs are bcrypt-hashed, and generated PINs have 6 digits. Five wrong tries lock the member for 15 minutes; the counter is atomic, so parallel guessing doesn't help. Rate limits apply per IP (the proxy-set address, not a spoofable header) and per member number. Error messages never reveal whether a member number or admin email exists. An apology recorded in advance is upgraded to *present* if the member then scans in. Typing someone else's name doesn't work: a check-in needs that member's own PIN or remembered phone. Officers can still **record manually** (present, excused or make-up, with a reason), and every manual record is audited.

Set PINs in **Admin → Members → (member) → Attendance PIN**. Leave the field blank to generate one. The PIN is shown once.

**Member IDs:** the seed gives officers placeholder IDs (`RCG-001` …). Replace them with Rotary member IDs or the club's own numbers before issuing PINs.

## Analytics

`/admin/attendance` understands Rotary years (1 July – 30 June) and stores a `rotaryYear` with each meeting, so editing old meetings never mixes up years. A member counts as *available* for a meeting from their **join date** until their **left date**. Set *Left the club on* when someone leaves, so historical percentages stay fair. Apologies (*excused*) count in the denominator; change this in `src/lib/analytics.ts` if your club excludes them.

* **Headline numbers:** total members, active members, meetings held, average attendance, this month, this Rotary year.
* **Charts:** attendance over time (line), attendance by meeting (stacked: present / guests / excused), member attendance rate (horizontal bars), monthly attendance, and a comparison by Rotary year.
* **Tables:** by meeting (present, guests, excused, absent, %) and by member (attended, available, %, last attended).
* **Filters:** date range, Rotary year, meeting, member, attendance status (including *absent*).
* **Export:** CSV, or Excel-friendly CSV (UTF-8 BOM and CRLF line endings). Cells are guarded against formula injection.

## Event & content discovery

| Source | Method | Goes to |
|---|---|---|
| District 9213 calendar | **iCal feed** `rotaryd9213.org/calendar-feed` (structured) | Events, PENDING REVIEW, *District* |
| District 9213 homepage "Upcoming Events" | Light HTML reading. This is where DG visits appear (the iCal feed omits them). Other clubs' DG visits are skipped | Events (ours → *Our events*) and a DG-visit suggestion |
| District 9213 stories / photo albums | List pages, filtered by `gayaza` | Inbox → Story or Album draft. Approving an album imports its photos |
| Rotary-O fellowships | Public list, one page per run (no API or feed exists) | Events, PENDING REVIEW, *Rotary community* |
| X (@Rcgayaza), newspapers, PDFs | **Admin → Sources → Import from source** (pasted link, reads Open Graph / JSON-LD) | Inbox |

Duplicates are prevented by `source + externalId`, then by normalised title + date. Every imported event stores its source, source URL, external ID, import date and last-checked date.

The scheduler runs inside the app every `INGEST_INTERVAL_HOURS` (default 12) when `INGEST_ENABLED=true`. Alternatives: `POST /api/cron/ingest` with `Authorization: Bearer $CRON_SECRET`, or a Coolify **Scheduled Task** running `node dist/scripts/ingest.js`. Requests are polite and safe: the scraper identifies itself, makes one request per source, waits 1.5 s between sources, times out after 20 s and caps responses at 8 MB. *Import from URL* refuses private, loopback and link-local addresses (SSRF guard, re-checked on every redirect).

> X offers no free, reliable public API, so the site shows a **Follow @Rcgayaza** card. `src/components/site/FollowX.tsx` takes a `posts` array, so a feed can be added later without the site depending on X.

## Roles

| Role | Can manage |
|---|---|
| Super admin | Everything, including users |
| Admin | Events, projects, members, attendance, all content, sources, audit log |
| Editor | Stories, projects, events, DG visits, media, Discovered Online |
| Attendance manager | Meetings and attendance only |

Important actions (logins, saves, deletes, approvals, PIN resets, exports, manual attendance) are written to the **audit log**.

## Brand

* Rotary Royal Blue `#17458F`, Rotary Gold `#F7A81B` and Azure `#0067C8`, with warm editorial neutrals and a Gayaza *murram* red used only for "roots" lines.
* Fonts are self-hosted (no Google Fonts call): Fraunces (display) and Open Sans (body; Rotary's recommended web substitute).
* **The Rotary wheel and Masterbrand Signature are never redrawn.** Until the official **club logo** is uploaded, the header shows a neutral text lockup. Download the club logo from Rotary's Brand Center and upload it unchanged under **Admin → Clubs → Rotary Club of Gayaza → Official club logo**, or set `NEXT_PUBLIC_CLUB_LOGO`.

## Project structure

```
prisma/schema.prisma        data model (User, Member, Session, Meeting, AttendanceSession, AttendanceRecord, Event,
                            EventSource, Project, Story, ImpactMetric, DGVisit, Club, ClubRelationship, President,
                            Media, Album, Announcement, TimelineEntry, SiteSection, DiscoveredItem, AuditLog, …)
prisma/seed.ts              verified starter content (idempotent) + optional demo data
src/app/(home)              homepage
src/app/(site)              public pages
src/app/(app)               attendance, member portal, scanner (mobile-first)
src/app/admin               admin (login + (panel))
src/lib/admin/resources.ts  declarative CMS: add a field once, get list + form + validation
src/lib/ingest              fetch, parsers (iCal, ClubRunner, Rotary-O, Open Graph/JSON-LD), runner
src/lib/analytics.ts        attendance maths (Rotary-year aware)
scripts/                    create-admin, ingest (bundled to dist/ at build)
```

## Useful commands

```bash
npm run dev | build | start | typecheck
npm run db:migrate          # prisma migrate deploy
npm run db:seed             # idempotent starter content
npm run admin:create -- --email x@y.org --role SUPER_ADMIN   # prints a temporary password
npm run ingest              # run discovery once (add a source key to run one, e.g. d9213-ical)
```

## Accessibility & performance

Semantic landmarks, a skip link, visible focus rings, keyboard-reachable family-tree nodes, ARIA live regions on check-in, reduced-motion support (animations and count-ups switch off), and 44 px+ touch targets. Scroll reveals only hide content when JavaScript is running, so crawlers and no-JS visitors see everything.

Pages render on the server with an in-process content cache that is cleared on every save. Images go through Next.js optimisation (AVIF/WebP, lazy loading), and galleries are paginated. Database indexes cover every list and filter. First-load JS is about 103–117 kB on public pages.

## Licence & credits

Photographs of the July 2025 DG visit are published by Rotary District 9213 and credited to them. "Rotary", the Rotary wheel and related marks belong to Rotary International.
