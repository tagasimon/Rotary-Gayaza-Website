import type { Metadata } from "next";
import Link from "next/link";
import { getEvents, getHomeClub, getMapPoints } from "@/lib/queries";
import { PageHero } from "@/components/site/PageHero";
import { EventRow } from "@/components/site/Cards";
import { MapView } from "@/components/site/MapView";

export const metadata: Metadata = { title: "Events", description: "Rotary Club of Gayaza events, District 9213 events and Rotary community fellowships — listed separately.", alternates: { canonical: "/events" } };

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ past?: string }> }) {
  const past = (await searchParams).past === "1";
  const [club, ours, district, community, points] = await Promise.all([
    getHomeClub(), getEvents("CLUB", { upcoming: !past }), getEvents("DISTRICT", { upcoming: !past }), getEvents("COMMUNITY", { upcoming: !past }), getMapPoints(),
  ]);
  const groups = [
    { id: "ours", title: "Our events", intro: `Run by the Rotary Club of Gayaza. Regular fellowship is every ${club.meetingDay} at ${club.meetingTime}, ${club.venue}.`, list: ours },
    { id: "district", title: "District events", intro: "From the Rotary District 9213 calendar. Each one links to the district's listing.", list: district },
    { id: "community", title: "Rotary community events", intro: "Fellowships from other clubs, listed on Rotary-O. Everyone is welcome.", list: community },
  ];
  return (
    <>
      <PageHero eyebrow="Events" title={past ? "Past events." : "What's happening."} intro="Three calendars, kept separate so you know whose event it is.">
        <nav className="mt-8 flex flex-wrap gap-2" aria-label="Event sections">
          {groups.map((g) => <a key={g.id} href={`#${g.id}`} className="chip hover:border-royal hover:text-royal">{g.title} · {g.list.length}</a>)}
          <Link href={past ? "/events" : "/events?past=1"} className="chip hover:border-royal hover:text-royal">{past ? "Upcoming events" : "Past events"}</Link>
        </nav>
      </PageHero>
      {groups.map((g, i) => (
        <section key={g.id} id={g.id} className={`scroll-mt-24 py-16 ${i % 2 ? "bg-paper-2" : ""}`}>
          <div className="wrap grid gap-8 md:grid-cols-12">
            <header className="md:col-span-4"><h2 className="text-4xl">{g.title}</h2><p className="mt-3 text-ink-2">{g.intro}</p></header>
            <div className="md:col-span-8">{g.list.length ? <ul>{g.list.map((e) => <EventRow key={e.id} e={e} />)}</ul> : <p className="border-t border-line py-6 text-ink-2">Nothing listed {past ? "yet" : "right now"}.</p>}</div>
          </div>
        </section>
      ))}
      <section className="py-16"><div className="wrap"><h2 className="mb-6 text-3xl">Where to find us</h2><MapView points={points} /></div></section>
    </>
  );
}
