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
| Homepage | `/` | Hero, **next Sunday fellowship** (with flyer), about and founding story, our work, impact numbers, latest projects, **Rotary family tree**, events, the board, **in the news**, **sponsors**, contact |
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
| Fellowship sign-in | `/attend` | The permanent-QR attendance form (member or guest, Rotarian or Rotaractor, club, name, email, phone) |
| Admin | `/admin` | A short menu: Dashboard, Attendance, Events, Projects, News & stories, Media appearances, Sponsors, Photos, Discovered online. Everything else is under "More" |

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
# optional, fake attendance history for testing:  SEED_DEMO=true npm run db:seed
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

There is **one permanent QR code**. It never changes, so print it once (**Admin → Attendance → Print poster**) and put it up every Sunday, or share the link in the WhatsApp group.

1. Someone scans the code. It opens **`/attend`**, a short form on the website.
2. They answer:
   - member of RC Gayaza, or guest
   - Rotarian, or Rotaractor
   - if a guest, which club (a searchable list of about 570 Rotary and Rotaract clubs in Districts 9213 and 9214; any club can be typed in)
   - full name, email and phone (at least one of the last two)
3. The sign-in is recorded against **that day's fellowship**, which is created automatically. Fellowship is every Sunday; a sign-in on another day goes to a "Club gathering" for that day. If the club has published an event for that day, the meeting takes its title.
4. Signing in twice on the same day (same email or phone) updates the first entry instead of adding a duplicate.
5. The phone remembers the person's answers, so next Sunday it's one tap.

Scanning from outside the venue is allowed on purpose. There are no PINs or logins for members.

When a member's email or phone matches the **Members & board** directory, the sign-in is linked to their record.

**Admin → Attendance** shows:
- the QR code, with a printable poster and an SVG download
- a list of fellowships with members, guests, Rotarians and Rotaractors for each
- a chart of the most recent fellowships
- a page per fellowship, where you can add someone by hand, remove an entry or rename the meeting
- an Excel-friendly CSV export, for everything or for one fellowship

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

Important actions (logins, saves, deletes, approvals, exports, manual attendance) are written to the **audit log**.

## Brand

* Rotary Royal Blue `#17458F`, Rotary Gold `#F7A81B` and Azure `#0067C8`, with warm editorial neutrals and a Gayaza *murram* red used only for "roots" lines.
* Fonts are self-hosted (no Google Fonts call): Libre Baskerville for headlines and Montserrat for labels and body text.
* The official **Rotary Club of Gayaza** logo (`public/brand/rc-gayaza-logo.png`, from the Brand Center files the club supplied) is used unchanged on white backgrounds. On dark backgrounds the site uses plain text instead of recolouring the mark. The Rotary wheel is never redrawn.

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
