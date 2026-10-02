import type { Metadata } from "next";
import { getHomeClub, getMapPoints } from "@/lib/queries";
import { PageHero } from "@/components/site/PageHero";
import { MapView } from "@/components/site/MapView";
import { FollowX } from "@/components/site/FollowX";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = { title: "Contact", description: "Visit the Rotary Club of Gayaza on Sundays at 5:00 PM at Eriot Recreation Centre, off Gayaza–Kalagi Road — or send us a message.", alternates: { canonical: "/contact" } };

export default async function Contact({ searchParams }: { searchParams: Promise<{ interest?: string }> }) {
  const [club, points, sp] = await Promise.all([getHomeClub(), getMapPoints(), searchParams]);
  const venuePoint = points.filter((p) => p.kind === "club");
  return (
    <>
      <PageHero eyebrow="Contact" title="Come on Sunday. Or write first." />
      <section className="py-16">
        <div className="wrap grid gap-14 md:grid-cols-12">
          <div className="md:col-span-5">
            <h2 className="eyebrow text-soil">Rotary Club of Gayaza</h2>
            <p className="mt-2 text-lg">Gayaza, Uganda · Rotary District {club.district}</p>
            <div className="mt-8 border-t-2 border-ink pt-5">
              <p className="eyebrow text-muted">Weekly meeting</p>
              <p className="display mt-1 text-3xl">{club.meetingDay}s, {club.meetingTime}</p>
              <p className="mt-2 font-semibold">{club.venue}</p>
              <p className="text-ink-2">{club.address}</p>
            </div>
            <ul className="mt-8 space-y-2 border-t border-line pt-5">
              {club.email && <li><span className="eyebrow mr-2 text-muted">Email</span><a className="underline" href={`mailto:${club.email}`}>{club.email}</a></li>}
              {club.xUrl && <li><span className="eyebrow mr-2 text-muted">X</span><a className="underline" href={club.xUrl} target="_blank" rel="noopener noreferrer">@Rcgayaza ↗</a></li>}
              {club.latitude && <li><span className="eyebrow mr-2 text-muted">Directions</span><a className="underline" href={`https://www.google.com/maps/search/?api=1&query=${club.latitude},${club.longitude}`} target="_blank" rel="noopener noreferrer">Open in Google Maps ↗</a></li>}
            </ul>
          </div>
          <div className="md:col-span-7">
            <h2 className="mb-6 text-3xl">Send a message</h2>
            <ContactForm interest={sp.interest} />
          </div>
        </div>
      </section>
      <section className="pb-16"><div className="wrap"><MapView points={venuePoint.length ? venuePoint : points} height={380} /><p className="mt-2 text-xs text-muted">Pin location from the District 9213 club directory.</p></div></section>
      <section className="pb-20"><div className="wrap"><FollowX url={club.xUrl ?? undefined} /></div></section>
    </>
  );
}
