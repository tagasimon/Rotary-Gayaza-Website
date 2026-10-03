import Link from "next/link";
import {
  getHomeClub, getSections, getMetrics, getProjects, getTimeline, getEvents, getPresidents, getLeadership,
  getStoryChapters, getSponsors, getPress, getNextFellowship, getDGVisits,
} from "@/lib/queries";
import { buildFamilyNodes } from "@/lib/family";
import { Img } from "@/components/site/Img";
import { Markdown } from "@/components/site/Markdown";
import { SectionHeading } from "@/components/site/SectionHeading";
import { CountUp } from "@/components/site/CountUp";
import { Countdown } from "@/components/site/Countdown";
import { FamilyTree } from "@/components/site/FamilyTree";
import { ProjectListItem, EventRow } from "@/components/site/Cards";
import { Reveal } from "@/components/site/Reveal";
import { JsonLd } from "@/components/site/JsonLd";
import { ContactForm } from "@/app/(site)/contact/ContactForm";
import { formatDate, formatTime } from "@/lib/time";
import { SITE_URL, excerpt, hostOf } from "@/lib/utils";

const ALBUM = "https://clubrunner.blob.core.windows.net/00000050109/PhotoAlbum/dg-geoffrey-visits-rc-gayaza/";

export default async function Home() {
  const [club, s, metrics, projects, timeline, ourEvents, districtEvents, communityEvents, presidents, leaders, chapters, sponsors, press, fellowship, visits, family] = await Promise.all([
    getHomeClub(), getSections("home."), getMetrics(), getProjects(), getTimeline(),
    getEvents("CLUB", { take: 4 }), getEvents("DISTRICT", { take: 4 }), getEvents("COMMUNITY", { take: 4 }),
    getPresidents(), getLeadership(), getStoryChapters(), getSponsors(), getPress(), getNextFellowship(), getDGVisits(), buildFamilyNodes(),
  ]);
  const hero = s["home.hero"], who = s["home.who"], join = s["home.join"];
  const started = chapters.find((c) => c.key === "story.where-we-started");
  const current = presidents.find((p) => p.isCurrent) ?? presidents[0];
  const people = [...leaders].sort((a, b) => a.roleOrder - b.roleOrder);
  const nextVisit = visits.find((v) => v.visitStatus === "NEXT" || v.visitStatus === "TODAY");
  const fe = fellowship.event;
  const featured = projects.filter((p) => p.featured).slice(0, 5);

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "NGO", name: club.name, url: SITE_URL(), email: club.email ?? undefined, logo: `${SITE_URL()}/brand/rc-gayaza-logo.png`,
        sameAs: [club.xUrl, "https://rotaryd9213.org/ClubInfo/gayaza"].filter(Boolean), foundingDate: club.charterDate?.toISOString().slice(0, 10),
        parentOrganization: { "@type": "Organization", name: "Rotary International", url: "https://www.rotary.org" },
        address: { "@type": "PostalAddress", streetAddress: club.address ?? undefined, addressLocality: "Gayaza", addressCountry: "UG" },
      }} />

      {/* HERO */}
      <section className="relative isolate flex min-h-[calc(100svh-78px)] items-center overflow-hidden bg-night text-white" aria-labelledby="hero-title">
        <Img src={hero?.imageUrl} alt="Members of the Rotary Club of Gayaza planting trees" fill priority sizes="100vw" className="-z-10 object-cover object-[50%_35%] opacity-45" />
        <div className="wrap py-24">
          <p className="eyebrow text-white/55">Welcome to the</p>
          <h1 id="hero-title" className="mt-4 max-w-3xl text-[2.6rem] leading-[1.25] sm:text-[3.6rem]">Rotary Club of Gayaza.</h1>
          <p className="mt-6 max-w-xl font-sans text-[1.05rem] leading-[1.85] text-white/70">{hero?.body}</p>
          <nav aria-label="Introduction" className="mt-12 flex flex-wrap gap-x-9 gap-y-3 font-sans">
            {[["More", "About who we are", "/our-story"], ["View", "Our work", "/projects"], ["Join", "Sunday fellowship", "/contact?interest=visit"]].map(([k, l, h]) => (
              <Link key={h} href={h} className="group"><span className="mr-2 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-white/40">{k}</span><span className="display text-[1.05rem] text-white group-hover:text-gold">{l}</span></Link>
            ))}
          </nav>
        </div>
      </section>

      {/* NEXT FELLOWSHIP */}
      <section className="border-b border-line" aria-labelledby="next-h">
        <div className="wrap grid items-center gap-10 py-16 md:grid-cols-12 sm:py-20">
          <div className="md:col-span-5">
            {fe?.imageUrl ? (
              <Link href={`/events/${fe.slug}`} className="block border border-line">
                <Img src={fe.imageUrl} alt={`Flyer: ${fe.title}`} width={1080} height={1080} className="h-auto w-full" sizes="(min-width: 768px) 40vw, 100vw" />
              </Link>
            ) : (
              <div className="relative aspect-square bg-paper-2"><Img src={`${ALBUM}MCK_5934.jpg`} alt="Club members at a Sunday fellowship" fill sizes="40vw" className="object-cover" /></div>
            )}
          </div>
          <div className="md:col-span-7 md:pl-6">
            <p className="eyebrow text-royal">Next fellowship · {formatDate(fellowship.date, "day")}</p>
            <h2 id="next-h" className="mt-3 text-[2rem] leading-[1.2] sm:text-[2.5rem]">{fe ? fe.title.replace(/[.:]$/, "") + "." : "Sunday fellowship."}</h2>
            <dl className="mt-6 grid gap-4 border-y border-line py-5 font-sans text-sm sm:grid-cols-3">
              <div><dt className="eyebrow text-muted">When</dt><dd className="mt-1 font-semibold text-ink">{formatDate(fellowship.startsAt, "short")}</dd></div>
              <div><dt className="eyebrow text-muted">Time</dt><dd className="mt-1 font-semibold text-ink">{formatTime(fellowship.startsAt)}</dd></div>
              <div><dt className="eyebrow text-muted">Where</dt><dd className="mt-1 font-semibold text-ink">{fellowship.venue}</dd></div>
            </dl>
            <p className="body-serif mt-6">{fe?.description ? excerpt(fe.description, 380) : `We meet every ${club.meetingDay} at ${club.meetingTime}. Visitors, Rotaractors and Rotarians from other clubs are always welcome.`}</p>
            <div className="mt-6"><Countdown to={fellowship.startsAt.toISOString()} tone="dark" /></div>
            <div className="mt-8 flex flex-wrap gap-3">
              {fe && <Link href={`/events/${fe.slug}`} className="btn btn-dark">Event details</Link>}
              <Link href="/attend" className="btn btn-line">Sign in on the day</Link>
            </div>
            {nextVisit && <p className="mt-6 font-sans text-sm text-muted">Also coming up: <Link href="/district-governor" className="font-semibold text-ink underline">District Governor {nextVisit.governorName}&rsquo;s visit, {formatDate(nextVisit.date, "short")}</Link>.</p>}
          </div>
        </div>
      </section>

      {/* ABOUT — split panel */}
      <section className="grid md:grid-cols-2" aria-labelledby="about-h">
        <div className="bg-paper-2 px-5 py-20 sm:px-12 lg:px-[max(2.5rem,calc((100vw-1180px)/2+2.5rem))]">
          <div className="max-w-[520px]">
            <p className="eyebrow text-royal">About</p>
            <h2 id="about-h" className="mt-2 text-[2rem]">{who?.title?.replace(/\.$/, "") ?? "Who we are"}.</h2>
            <Markdown className="mt-6 font-sans text-[1.05rem] leading-[1.85] text-muted [&_p]:mb-5">{who?.body}</Markdown>
            <dl className="mt-4 space-y-4 font-sans text-sm">
              <div><dt className="eyebrow text-royal">Chartered</dt><dd className="body-serif">{club.charterDateLabel} · Club ID {club.clubNumber} · Rotary District {club.district}</dd></div>
              <div><dt className="eyebrow text-royal">Fellowship</dt><dd className="body-serif">Every {club.meetingDay} at {club.meetingTime}, {club.venue}</dd></div>
              <div><dt className="eyebrow text-royal">Motto</dt><dd className="body-serif">Service Above Self</dd></div>
            </dl>
            <div className="mt-10 flex flex-col gap-2 sm:max-w-sm">
              <Link href="/contact" className="btn btn-grey">Contact the club</Link>
              <Link href="/our-story" className="btn btn-dark">Read our story</Link>
            </div>
          </div>
        </div>
        <div className="px-5 py-20 sm:px-12">
          <div className="max-w-[520px]">
            <h2 className="text-[2rem]">The founding story.</h2>
            {started?.body && <p className="lede mt-6">{started.body}</p>}
            <ol className="mt-10 space-y-6">
              {timeline.slice(0, 6).map((t) => (
                <li key={t.id} className="grid grid-cols-[18px_1fr] gap-3">
                  <span aria-hidden className="mt-[7px] block h-2 w-2 rounded-full bg-royal" />
                  <div>
                    <p className="eyebrow text-ink">{t.dateLabel}</p>
                    <p className="body-serif mt-1">{t.title}. {t.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* OUR WORK — black band */}
      <section className="relative overflow-hidden bg-black text-white" aria-labelledby="work-h">
        <div className="grid md:grid-cols-2">
          <div className="px-5 py-20 sm:px-12 lg:pl-[max(2.5rem,calc((100vw-1180px)/2+2.5rem))]">
            <p className="eyebrow text-gold">Where we serve</p>
            <h2 id="work-h" className="mt-2 text-[2rem]">Some of our work.</h2>
            <ol className="mt-8 space-y-6">
              {featured.map((p, i) => (
                <li key={p.id} className="body-serif !text-white/55">
                  <Link href={`/projects/${p.slug}`} className="text-white hover:text-gold">{i + 1}. {p.title}</Link>
                  {p.summary ? ` — ${excerpt(p.summary, 150)}` : ""}
                </li>
              ))}
            </ol>
            <Link href="/projects" className="btn btn-ghost mt-10">All projects</Link>
          </div>
          <div className="relative min-h-[360px]">
            <Img src={`${ALBUM}MCK_5724.jpg`} alt="Members opening a water point" fill sizes="50vw" className="photo-mono object-cover opacity-80" />
          </div>
        </div>
      </section>

      {/* NUMBERS */}
      {metrics.length > 0 && (
        <section className="bg-night-2 py-14 text-white" aria-label="Impact in numbers">
          <ul className="wrap grid grid-cols-2 lg:grid-cols-4">
            {metrics.slice(0, 4).map((m, i) => (
              <li key={m.id} className={`px-4 py-6 text-center ${i ? "lg:border-l lg:border-white/10" : ""}`}>
                <p className="font-sans text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white/85">{m.label}</p>
                <span aria-hidden className="mx-auto my-3 block h-px w-16 bg-white/20" />
                <p className="font-sans text-[2.6rem] font-bold leading-none text-gold"><CountUp display={m.value} to={m.numericValue} /></p>
                <p className="mt-3 font-sans text-[0.68rem] text-white/40">{m.period}{m.sourceUrl ? <> · <a href={m.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">{hostOf(m.sourceUrl)}</a></> : " · club records"}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* LATEST PROJECTS */}
      <section className="bg-paper-2 py-24" aria-labelledby="latest-h">
        <div className="wrap">
          <SectionHeading id="latest-h" title="Our latest projects." align="center" />
          <div className="grid gap-x-16 gap-y-14 md:grid-cols-2">
            {projects.slice(0, 6).map((p) => <Reveal key={p.id}><ProjectListItem p={p} /></Reveal>)}
          </div>
        </div>
      </section>

      {/* ROTARY FAMILY */}
      <section className="bg-night py-24 text-white" aria-labelledby="family-h">
        <div className="wrap">
          <SectionHeading id="family-h" tone="light" eyebrow="Our Rotary family" title="One club can create many more." intro="Two clubs helped Gayaza take root. Gayaza has since mothered and supported Rotaract and Interact clubs of its own." />
          <FamilyTree nodes={family.nodes} centre={family.centre} />
          <Link href="/rotary-family" className="btn btn-ghost mt-10">Explore the family</Link>
        </div>
      </section>

      {/* EVENTS */}
      <section className="py-24" aria-labelledby="events-h">
        <div className="wrap">
          <SectionHeading id="events-h" eyebrow="What's happening" title="Come and see for yourself." />
          <div className="grid gap-12 lg:grid-cols-3">
            {([["Our events", ourEvents, "CLUB"], ["District 9213", districtEvents, "DISTRICT"], ["Rotary community", communityEvents, "COMMUNITY"]] as const).map(([label, list, key]) => (
              <div key={key}>
                <h3 className="eyebrow mb-2 text-royal">{label}</h3>
                {list.length ? <ul>{list.map((e) => <EventRow key={e.id} e={e} compact />)}</ul> : <p className="body-serif border-t border-line py-5">{key === "CLUB" ? `Fellowship every ${club.meetingDay} at ${club.meetingTime}, ${club.venue}.` : "Nothing listed right now."}</p>}
              </div>
            ))}
          </div>
          <Link href="/events" className="link-arrow mt-10">Full calendar</Link>
        </div>
      </section>

      {/* PEOPLE */}
      {current && (
        <section className="border-t border-line py-24" aria-labelledby="people-h">
          <div className="wrap">
            <SectionHeading id="people-h" eyebrow="Leadership" title="The people." intro={`The ${current.rotaryYear} board of the Rotary Club of Gayaza, led by President ${current.name}.`} />
            <div className="grid gap-x-16 md:grid-cols-2">
              {[people.slice(0, Math.ceil(people.length / 2)), people.slice(Math.ceil(people.length / 2))].map((col, ci) => (
                <ul key={ci} className="relative border-l border-line">
                  {col.map((m) => (
                    <li key={m.id} className="relative pb-8 pl-10">
                      <span aria-hidden className="absolute -left-[13px] top-0 grid h-[26px] w-[26px] place-items-center rounded-full bg-royal font-sans text-[0.6rem] font-bold text-white">{m.fullName.split(" ").map((x) => x[0]).slice(0, 2).join("")}</span>
                      <p className="font-sans text-[1.05rem] font-bold text-ink">{m.fullName}</p>
                      <p className="font-sans text-xs font-bold text-muted">{m.rotaryRole}</p>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
            <Link href="/leadership" className="link-arrow">Leadership & past presidents</Link>
          </div>
        </section>
      )}

      {/* PRESS */}
      {press.length > 0 && (
        <section className="bg-paper-2 py-24" aria-labelledby="press-h">
          <div className="wrap">
            <SectionHeading id="press-h" title="In the news." align="center" />
            <ul className="mx-auto grid max-w-5xl gap-x-16 gap-y-12 md:grid-cols-2">
              {press.map((m) => (
                <li key={m.id}>
                  <p className="font-sans text-[0.95rem] font-bold uppercase tracking-[0.04em] text-ink">{m.outlet}{m.date ? ` · ${formatDate(m.date, "short")}` : ""}</p>
                  <p className="mt-1 font-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-royal">{m.kind === "video" ? "Video" : "Article"}{m.language ? ` · ${m.language}` : ""}</p>
                  <a href={m.url} target="_blank" rel="noopener noreferrer" className="display mt-3 block text-[1.2rem] leading-snug hover:text-royal">{m.title} ↗</a>
                  {m.titleEnglish && <p className="mt-1 font-sans text-sm italic text-muted">“{m.titleEnglish}”</p>}
                  {m.summary && <p className="body-serif mt-3">{m.summary}</p>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* SPONSORS */}
      {sponsors.length > 0 && (
        <section className="py-20" aria-labelledby="sponsors-h">
          <div className="wrap">
            <SectionHeading id="sponsors-h" eyebrow="With thanks" title="Our sponsors." align="center" intro="Businesses and institutions that make our service possible." />
            <ul className="grid grid-cols-2 border-l border-t border-line md:grid-cols-4">
              {sponsors.map((sp) => {
                const inner = sp.logoUrl
                  ? // eslint-disable-next-line @next/next/no-img-element
                    <img src={sp.logoUrl} alt={sp.name} className="mx-auto max-h-16 w-auto object-contain" />
                  : <span className="display text-center text-[1.05rem] leading-snug text-ink">{sp.name}</span>;
                return (
                  <li key={sp.id} className="flex min-h-[140px] items-center justify-center border-b border-r border-line p-6">
                    {sp.url ? <a href={sp.url} target="_blank" rel="noopener noreferrer" className="block transition-opacity hover:opacity-70">{inner}</a> : inner}
                  </li>
                );
              })}
            </ul>
            <p className="mt-6 text-center font-sans text-sm text-muted">Want to support our work? <Link href="/contact?interest=partner" className="font-semibold text-ink underline">Become a sponsor</Link>.</p>
          </div>
        </section>
      )}

      {/* CONTACT */}
      <section className="relative isolate overflow-hidden bg-[#3a3a3a] py-24 text-white" aria-labelledby="contact-h">
        <Img src={`${ALBUM}MCK_5934.jpg`} alt="" fill sizes="100vw" className="photo-mono -z-10 object-cover opacity-20" />
        <div className="wrap max-w-2xl text-center">
          <p className="eyebrow text-gold">{join?.eyebrow ?? "Get involved"}</p>
          <h2 id="contact-h" className="mt-3 text-[2rem] leading-[1.3] sm:text-[2.4rem]">{join?.title ?? "There is a seat for you on Sunday."}</h2>
          {join?.body && <p className="mx-auto mt-5 max-w-xl font-sans leading-[1.85] text-white/65">{join.body}</p>}
          <div className="mt-10 text-left"><ContactForm tone="dark" /></div>
        </div>
      </section>
    </>
  );
}
