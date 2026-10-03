import Link from "next/link";
import {
  getHomeClub, getSections, getMetrics, getProjects, getTimeline, getEvents, getPresidents, getLeadership,
  getStories, getSponsors, getPress, getNextFellowship, getDGVisits,
} from "@/lib/queries";
import { buildFamilyNodes } from "@/lib/family";
import { Img } from "@/components/site/Img";
import { Markdown } from "@/components/site/Markdown";
import { SectionHeading } from "@/components/site/SectionHeading";
import { CountUp } from "@/components/site/CountUp";
import { Countdown } from "@/components/site/Countdown";
import { FamilyTree } from "@/components/site/FamilyTree";
import { Timeline } from "@/components/site/Timeline";
import { ProjectFeature, StoryCard, EventRow } from "@/components/site/Cards";
import { Reveal, ImageReveal } from "@/components/site/Reveal";
import { FollowX } from "@/components/site/FollowX";
import { MapView } from "@/components/site/MapView";
import { JsonLd } from "@/components/site/JsonLd";
import { formatDate, formatTime } from "@/lib/time";
import { SITE_URL, excerpt, hostOf } from "@/lib/utils";

export default async function Home() {
  const [club, s, metrics, projects, timeline, ourEvents, districtEvents, communityEvents, presidents, leaders, stories, sponsors, press, fellowship, visits, family] = await Promise.all([
    getHomeClub(), getSections("home."), getMetrics(), getProjects(), getTimeline(),
    getEvents("CLUB", { take: 4 }), getEvents("DISTRICT", { take: 4 }), getEvents("COMMUNITY", { take: 4 }),
    getPresidents(), getLeadership(), getStories(4), getSponsors(), getPress(), getNextFellowship(), getDGVisits(), buildFamilyNodes(),
  ]);
  const hero = s["home.hero"], who = s["home.who"], join = s["home.join"];
  const featured = [...projects.filter((p) => p.featured), ...projects.filter((p) => !p.featured)].slice(0, 3);
  const current = presidents.find((p) => p.isCurrent) ?? presidents[0];
  const officers = [...leaders].sort((a, b) => a.roleOrder - b.roleOrder).filter((m) => m.fullName !== current?.name);
  const nextVisit = visits.find((v) => v.visitStatus === "NEXT" || v.visitStatus === "TODAY");
  const fe = fellowship.event;
  const now = new Date();
  const heroTitle = hero?.title ?? "Service takes root in Gayaza.";
  const words = heroTitle.split(" ");
  const isToday = formatDate(fellowship.date, "short") === formatDate(now, "short");
  const venuePoint = club.latitude && club.longitude ? [{ kind: "club" as const, title: club.venue ?? "Eriot Recreation Centre", subtitle: `Fellowship every ${club.meetingDay}, ${club.meetingTime}`, lat: club.latitude, lng: club.longitude }] : [];

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "NGO", name: club.name, url: SITE_URL(), email: club.email ?? undefined, logo: `${SITE_URL()}/brand/rc-gayaza-logo.png`,
        sameAs: [club.xUrl, "https://rotaryd9213.org/ClubInfo/gayaza"].filter(Boolean), foundingDate: club.charterDate?.toISOString().slice(0, 10),
        parentOrganization: { "@type": "Organization", name: "Rotary International", url: "https://www.rotary.org" },
        address: { "@type": "PostalAddress", streetAddress: club.address ?? undefined, addressLocality: "Gayaza", addressCountry: "UG" },
        location: { "@type": "Place", name: club.venue, geo: club.latitude ? { "@type": "GeoCoordinates", latitude: club.latitude, longitude: club.longitude } : undefined },
      }} />

      {/* HERO */}
      <section className="relative isolate flex min-h-[94svh] items-end overflow-hidden bg-royal-deep text-white" aria-labelledby="hero-title">
        <Img src={hero?.imageUrl} alt="Members of the Rotary Club of Gayaza planting trees" fill priority sizes="100vw" className="-z-10 object-cover object-[50%_35%]" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(11,42,92,.55)_0%,rgba(23,69,143,.12)_35%,rgba(15,52,116,.82)_78%,#0f3474_100%)]" />
        <svg aria-hidden className="absolute bottom-0 left-0 -z-10 h-48 w-full text-gold/50" viewBox="0 0 1440 200" preserveAspectRatio="none">
          <path d="M0 200 C 240 140, 420 190, 620 150 S 980 80, 1440 120" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M0 180 C 300 170, 520 120, 760 140 S 1100 170, 1440 90" fill="none" stroke="currentColor" strokeWidth=".6" />
        </svg>
        <div className="wrap pb-44 pt-36 sm:pb-48">
          <p className="eyebrow text-gold">{hero?.eyebrow ?? `Rotary District ${club.district} · Gayaza, Uganda`}</p>
          <h1 id="hero-title" className="mt-5 max-w-4xl text-[clamp(2.8rem,8.4vw,7rem)] font-extrabold leading-[0.95] tracking-[-0.035em]">
            {words.map((w, i) => i === words.length - 1
              ? <em key={i} className="serif font-normal italic tracking-[-0.02em] text-gold">{w}</em>
              : <span key={i}>{w} </span>)}
          </h1>
          <p className="serif mt-6 max-w-xl text-lg leading-relaxed text-white/90 sm:text-xl">{hero?.body}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/contact?interest=join" className="btn btn-gold">Join / get involved</Link>
            <Link href="/impact" className="btn btn-ghost text-white">See our impact</Link>
            <Link href="/attend" className="btn btn-ghost text-white">Fellowship sign-in</Link>
          </div>
        </div>
      </section>

      {/* THE NEXT BIG THING: next Sunday fellowship */}
      <section aria-labelledby="next-title" className="relative z-10 -mt-28">
        <div className="wrap">
          <div className="grid overflow-hidden rounded-2xl bg-royal text-white shadow-[0_30px_60px_-30px_rgba(12,42,92,.85)] ring-1 ring-white/10 md:grid-cols-12">
            {fe?.imageUrl && (
              <Link href={`/events/${fe.slug}`} className="relative block aspect-square bg-white md:col-span-4 md:aspect-auto md:min-h-full">
                <Img src={fe.imageUrl} alt={`Flyer: ${fe.title}`} fill className="object-contain" sizes="(min-width: 768px) 33vw, 100vw" />
              </Link>
            )}
            <div className={`flex flex-col justify-center gap-6 p-6 sm:p-8 ${fe?.imageUrl ? "md:col-span-8" : "md:col-span-12"}`}>
              <div>
                <p className="eyebrow flex items-center gap-2 text-gold">
                  <span className="relative inline-flex h-2.5 w-2.5"><span className="pulse-ring absolute inset-0 rounded-full bg-gold" /><span className="relative h-2.5 w-2.5 rounded-full bg-gold" /></span>
                  {isToday ? "Today" : "Next fellowship"} · {formatDate(fellowship.date, "day")}
                </p>
                <h2 id="next-title" className="mt-3 text-3xl leading-tight sm:text-4xl">{fe?.title ?? "Sunday fellowship"}</h2>
                <p className="mt-2 text-white/85">{formatTime(fellowship.startsAt)} · {fellowship.venue}</p>
                {fe?.description && <p className="serif mt-4 max-w-2xl text-white/80">{excerpt(fe.description, 260)}</p>}
              </div>
              <div className="flex flex-wrap items-end justify-between gap-6 border-t border-white/15 pt-6">
                <Countdown to={fellowship.startsAt.toISOString()} />
                <div className="flex flex-wrap gap-3">
                  {fe && <Link href={`/events/${fe.slug}`} className="btn btn-gold">Event details</Link>}
                  <Link href="/attend" className="btn btn-ghost text-white">Sign in on the day</Link>
                </div>
              </div>
              {nextVisit && <p className="text-sm text-white/75">Also coming up: <Link href="/district-governor" className="font-semibold text-gold hover:underline">District Governor {nextVisit.governorName}&rsquo;s visit, {formatDate(nextVisit.date, "short")}</Link></p>}
            </div>
          </div>
        </div>
      </section>

      {/* 01 WHO WE ARE */}
      <section className="grain py-24 sm:py-32" aria-labelledby="who">
        <div className="wrap">
          <SectionHeading id="who" num="01" eyebrow={who?.eyebrow ?? "Who we are"} title={who?.title ?? "Who we are"} />
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-6 md:col-start-4"><Markdown className="prose-story">{who?.body}</Markdown>
              <Link href="/our-story" className="link-arrow mt-2">Read our story</Link>
            </div>
            <aside className="md:col-span-3">
              <dl className="space-y-5 border-l-2 border-gold pl-5 text-sm">
                <div><dt className="eyebrow text-azure">Chartered</dt><dd className="display mt-1 text-2xl text-royal">{club.charterDateLabel}</dd><dd className="text-muted">Club ID {club.clubNumber}</dd></div>
                <div><dt className="eyebrow text-azure">We meet</dt><dd className="mt-1 font-semibold">{club.meetingDay}s, {club.meetingTime}</dd><dd className="serif text-ink-2">{club.venue}</dd></div>
                <div><dt className="eyebrow text-azure">District</dt><dd className="mt-1 font-semibold">Rotary District {club.district}</dd></div>
                <div><dt className="eyebrow text-azure">Motto</dt><dd className="serif mt-1 text-xl italic text-royal">Service Above Self</dd></div>
              </dl>
            </aside>
          </div>
        </div>
      </section>

      {/* 02 IMPACT NUMBERS */}
      {metrics.length > 0 && (
        <section className="border-y border-royal/10 bg-mist py-20 sm:py-28" aria-labelledby="impact-h">
          <div className="wrap">
            <SectionHeading id="impact-h" num="02" eyebrow="What we have done" title="Evidence, not adjectives." intro="Every number below says when it was counted and where it comes from." />
            <ul className="grid gap-px overflow-hidden rounded-xl bg-royal/15 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((m, i) => (
                <Reveal as="li" key={m.id} delay={i * 0.08} className="flex flex-col bg-white p-6 sm:p-8">
                  <span className="display text-6xl font-extrabold leading-none text-royal sm:text-7xl"><CountUp display={m.value} to={m.numericValue} /></span>
                  <span aria-hidden className="mt-4 block h-[3px] w-10 bg-gold" />
                  <span className="serif mt-4 text-lg leading-snug text-ink">{m.label}</span>
                  <span className="mt-auto pt-6 text-xs text-muted">
                    {m.period}
                    {" · "}
                    {m.sourceUrl ? <a href={m.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-royal">{m.sourceLabel ?? hostOf(m.sourceUrl)} ↗</a> : "Club records"}
                  </span>
                </Reveal>
              ))}
            </ul>
            <Link href="/impact" className="link-arrow mt-8">Explore our impact by area</Link>
          </div>
        </section>
      )}

      {/* 03 PROJECT STORIES */}
      {featured.length > 0 && (
        <section className="grain py-24 sm:py-32" aria-labelledby="projects-h">
          <div className="wrap">
            <SectionHeading id="projects-h" num="03" eyebrow="Project stories" title="The work, up close." intro="The challenge, what members did and who was reached." />
            <div className="space-y-20 sm:space-y-28">
              {featured.map((p, i) => <Reveal key={p.id}><ProjectFeature p={p} flip={i % 2 === 1} index={i} /></Reveal>)}
            </div>
            <div className="mt-16 text-center"><Link href="/projects" className="btn btn-line">All projects</Link></div>
          </div>
        </section>
      )}

      {/* 04 ROTARY FAMILY */}
      <section className="band-royal relative overflow-hidden py-24 text-white sm:py-32" aria-labelledby="family-h">
        <div className="wrap">
          <SectionHeading id="family-h" num="04" tone="light" eyebrow="Our Rotary family" title="One club can create many more."
            intro="Two clubs helped Gayaza take root. Gayaza has since mothered the Rotaract Clubs of Gayaza, Gayaza Football, Manyangwa Football and Bugema, and supported Interact and Rotaract clubs in local schools." />
          <FamilyTree nodes={family.nodes} centre={family.centre} />
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-6 text-sm text-white/70">
            <p>Relationships are labelled exactly as recorded: <em>mother club</em>, <em>supported</em>, <em>sponsored</em>, <em>mentored</em> or <em>chartered</em>.</p>
            <Link href="/rotary-family" className="font-semibold text-gold hover:underline">Explore the family →</Link>
          </div>
        </div>
      </section>

      {/* 05 TIMELINE */}
      <section className="grain py-24 sm:py-32" aria-labelledby="time-h">
        <div className="wrap">
          <SectionHeading id="time-h" num="05" eyebrow="2021 → Today → Next" title="A short history, still being written." />
          <Timeline items={timeline.map((t) => ({ id: t.id, dateLabel: t.dateLabel, title: t.title, description: t.description, kind: t.kind, href: t.linkUrl, upcoming: t.date > now, pending: t.verification !== "VERIFIED", sourceUrl: t.sourceUrl, sourceLabel: t.sourceLabel }))} />
          <Link href="/our-story" className="link-arrow mt-4">Read our story</Link>
        </div>
      </section>

      {/* 06 EVENTS */}
      <section className="border-t border-royal/10 bg-mist py-24 sm:py-28" aria-labelledby="events-h">
        <div className="wrap">
          <SectionHeading id="events-h" num="06" eyebrow="What's happening" title="Come and see for yourself." intro="Our own events, the wider District 9213 calendar and Rotary community fellowships, kept separate so you can tell them apart." />
          <div className="grid gap-12 lg:grid-cols-3">
            {([["Our events", ourEvents, "CLUB"], ["District events", districtEvents, "DISTRICT"], ["Rotary community", communityEvents, "COMMUNITY"]] as const).map(([label, list, key]) => (
              <div key={key}>
                <h3 className="eyebrow mb-2 text-royal">{label}</h3>
                {list.length ? <ul>{list.map((e) => <EventRow key={e.id} e={e} compact />)}</ul> : (
                  <p className="serif border-t border-line py-5 text-ink-2">{key === "CLUB" ? `Every ${club.meetingDay} at ${club.meetingTime}, ${club.venue}. Visitors welcome.` : "Nothing listed right now."}</p>
                )}
              </div>
            ))}
          </div>
          <Link href="/events" className="link-arrow mt-10">Full calendar</Link>
        </div>
      </section>

      {/* 07 MEET THE PEOPLE */}
      {current && (
        <section className="grain py-24 sm:py-32" aria-labelledby="people-h">
          <div className="wrap">
            <SectionHeading id="people-h" num="07" eyebrow="Meet the people" title="Led by members, for members." />
            <div className="grid gap-12 md:grid-cols-12">
              <div className="md:col-span-5">
                <ImageReveal className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-royal">
                  {current.photoUrl ? <Img src={current.photoUrl} alt={current.name} fill sizes="40vw" className="object-cover" /> : (
                    <div className="band-royal absolute inset-0 flex flex-col justify-end p-8 text-white">
                      <span className="display text-[8rem] font-extrabold leading-none text-gold">{current.name.split(" ").map((x) => x[0]).join("")}</span>
                      <span className="eyebrow mt-2 text-white/80">President {current.rotaryYear}</span>
                    </div>
                  )}
                </ImageReveal>
              </div>
              <div className="md:col-span-7 md:pt-6">
                <p className="eyebrow text-azure">President · {current.rotaryYear}</p>
                <p className="display mt-3 text-5xl text-royal sm:text-6xl">{current.name}</p>
                {current.message ? <blockquote className="serif mt-6 border-l-4 border-gold pl-6 text-2xl italic leading-snug text-ink-2">“{current.message}”</blockquote> : null}
                <ul className="mt-10 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  {officers.slice(0, 10).map((m) => (
                    <li key={m.id} className="border-t-2 border-mist pt-3"><p className="font-bold text-ink">{m.fullName}</p><p className="serif text-sm text-muted">{m.rotaryRole}</p></li>
                  ))}
                </ul>
                <Link href="/leadership" className="link-arrow mt-8">Leadership & past presidents</Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 08 IN THE NEWS */}
      {press.length > 0 && (
        <section className="border-t border-royal/10 bg-mist py-24" aria-labelledby="press-h">
          <div className="wrap">
            <SectionHeading id="press-h" num="08" eyebrow="In the news" title="What others are saying." />
            <ul className="grid gap-6 md:grid-cols-3">
              {press.map((m, i) => (
                <Reveal as="li" key={m.id} delay={i * 0.08} className="flex flex-col rounded-xl border-t-4 border-gold bg-white p-6 shadow-[0_20px_40px_-30px_rgba(15,52,116,.6)]">
                  <p className="eyebrow text-azure">{m.outlet}{m.date ? ` · ${formatDate(m.date, "short")}` : ""}</p>
                  <p className="mt-1 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted">{m.kind === "video" ? "▶ Video" : "Article"}{m.language ? ` · ${m.language}` : ""}</p>
                  <a href={m.url} target="_blank" rel="noopener noreferrer" className="display mt-4 block text-xl leading-snug text-royal hover:text-azure">{m.title} ↗</a>
                  {m.titleEnglish && <p className="serif mt-2 text-sm italic text-muted">“{m.titleEnglish}”</p>}
                  {m.summary && <p className="serif mt-3 text-[0.95rem] leading-relaxed text-ink-2">{excerpt(m.summary, 220)}</p>}
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 09 STORIES */}
      {stories.length > 0 && (
        <section className="border-t border-line py-24" aria-labelledby="stories-h">
          <div className="wrap">
            <SectionHeading id="stories-h" num="09" eyebrow="Stories of service" title="Told by the people who were there." />
            <div className="grid gap-12 md:grid-cols-2">{stories.slice(0, 2).map((st, i) => <Reveal key={st.id} delay={i * 0.1}><StoryCard s={st} size="lg" /></Reveal>)}</div>
            <Link href="/stories" className="link-arrow mt-10">All stories</Link>
            <div className="mt-16"><FollowX url={club.xUrl ?? undefined} /></div>
          </div>
        </section>
      )}

      {/* SPONSORS */}
      {sponsors.length > 0 && (
        <section className="py-20" aria-labelledby="sponsors-h">
          <div className="wrap">
            <SectionHeading id="sponsors-h" eyebrow="With thanks" title="Our sponsors." align="center" intro="Businesses and institutions that make our service possible." />
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {sponsors.map((sp) => {
                const inner = sp.logoUrl
                  ? // eslint-disable-next-line @next/next/no-img-element
                    <img src={sp.logoUrl} alt={sp.name} className="mx-auto max-h-16 w-auto object-contain" />
                  : <span className="display text-center text-[1.05rem] leading-snug text-royal">{sp.name}</span>;
                return (
                  <li key={sp.id} className="flex min-h-[140px] items-center justify-center rounded-xl border border-royal/10 bg-white p-6 transition hover:-translate-y-0.5 hover:border-gold hover:shadow-[0_20px_40px_-30px_rgba(15,52,116,.6)]">
                    {sp.url ? <a href={sp.url} target="_blank" rel="noopener noreferrer" className="block">{inner}</a> : inner}
                  </li>
                );
              })}
            </ul>
            <p className="mt-6 text-center text-sm text-muted">Want to support our work? <Link href="/contact?interest=partner" className="font-semibold text-royal underline">Become a sponsor</Link>.</p>
          </div>
        </section>
      )}

      {/* FIND US */}
      {venuePoint.length > 0 && (
        <section className="border-t border-line py-20" aria-labelledby="find-h">
          <div className="wrap grid gap-10 md:grid-cols-12 md:items-center">
            <div className="md:col-span-4">
              <p className="eyebrow text-azure">Find us</p>
              <h2 id="find-h" className="mt-3 text-4xl leading-tight text-royal">Every {club.meetingDay}, {club.meetingTime}.</h2>
              <p className="serif mt-4 text-lg text-ink-2">{club.venue}{club.address ? `, ${club.address}` : ""}</p>
              <p className="mt-4 text-sm text-muted">Visitors, Rotaractors and Rotarians from other clubs are always welcome. Scan the QR code at the door or <Link href="/attend" className="font-semibold text-royal underline">sign in here</Link>.</p>
            </div>
            <div className="md:col-span-8"><MapView points={venuePoint} height={360} /></div>
          </div>
        </section>
      )}

      {/* 10 JOIN */}
      <section className="relative overflow-hidden bg-gold py-24 text-royal-ink sm:py-32" aria-labelledby="join-h">
        <svg aria-hidden className="absolute -right-24 -top-24 h-[480px] w-[480px] text-royal/15" viewBox="0 0 200 200"><path d="M100 200 C100 140 100 120 100 100 M100 100 C 80 70 50 60 20 40 M100 100 C 120 70 150 60 180 40 M100 120 C 70 110 40 115 10 100 M100 120 C 130 110 160 115 190 100 M100 80 C 100 50 95 30 100 0" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
        <div className="wrap relative">
          <p className="eyebrow text-royal">10 · {join?.eyebrow ?? "Get involved"}</p>
          <h2 id="join-h" className="mt-4 max-w-3xl text-5xl font-extrabold leading-[1.02] sm:text-7xl">{join?.title ?? "There is a seat for you on Sunday."}</h2>
          {join?.body && <p className="serif mt-6 max-w-xl text-lg">{join.body}</p>}
          <ul className="mt-12 grid gap-px overflow-hidden rounded-xl bg-royal/15 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Attend a fellowship", `${club.meetingDay}s, ${club.meetingTime} at ${club.venue}.`, "/contact?interest=visit"],
              ["Sign in at fellowship", "Scan the QR code at the door, or use this link on the day.", "/attend"],
              ["Support a project", "Fund, supply or show up for a service project.", "/contact?interest=support"],
              ["Partner or sponsor", "Schools, businesses, health centres and NGOs.", "/contact?interest=partner"],
              ["Learn about Rotary", "What Rotary is and how membership works.", "https://www.rotary.org/en/get-involved/join"],
              ["Contact the club", club.email ?? "Send us a message.", "/contact"],
            ].map(([t, d, href]) => (
              <li key={t} className="bg-gold">
                <Link href={href} className="group flex h-full flex-col p-6 transition hover:bg-gold-soft">
                  <span className="display text-2xl">{t}</span>
                  <span className="serif mt-2 text-sm text-royal-ink/80">{d}</span>
                  <span aria-hidden className="mt-6 text-xl transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
