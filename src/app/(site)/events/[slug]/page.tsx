import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvent } from "@/lib/queries";
import { PageHero } from "@/components/site/PageHero";
import { Img } from "@/components/site/Img";
import { Countdown } from "@/components/site/Countdown";
import { Markdown } from "@/components/site/Markdown";
import { MapView } from "@/components/site/MapView";
import { ShareButtons } from "@/components/site/ShareButtons";
import { JsonLd } from "@/components/site/JsonLd";
import { formatDate, formatTime } from "@/lib/time";
import { absUrl, excerpt } from "@/lib/utils";

type P = { params: Promise<{ slug: string }> };
const TYPE: Record<string, string> = { CLUB_EVENT: "Club event", FELLOWSHIP: "Fellowship", SERVICE_PROJECT: "Service project", DISTRICT_EVENT: "District event", DG_VISIT: "District Governor's visit", ROTARY_WIDE: "Rotary-wide event", YOUTH_EVENT: "Youth event", SPECIAL_EVENT: "Special event" };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const e = await getEvent((await params).slug);
  if (!e) return {};
  return { title: e.title, description: excerpt(e.description, 160) || `${formatDate(e.startsAt)} · ${e.venue ?? ""}`, alternates: { canonical: `/events/${e.slug}` } };
}

export default async function EventPage({ params }: P) {
  const e = await getEvent((await params).slug);
  if (!e) notFound();
  const future = e.startsAt > new Date();
  return (
    <article>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Event", name: e.title, description: e.description ?? undefined, startDate: e.startsAt.toISOString(), endDate: e.endsAt?.toISOString(),
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode", eventStatus: "https://schema.org/EventScheduled",
        location: { "@type": "Place", name: e.venue ?? "Gayaza", address: e.address ?? e.location ?? "Gayaza, Uganda", geo: e.latitude ? { "@type": "GeoCoordinates", latitude: e.latitude, longitude: e.longitude } : undefined },
        organizer: { "@type": "Organization", name: e.organiser ?? "Rotary Club of Gayaza" }, image: e.imageUrl ? [absUrl(e.imageUrl)] : undefined, url: absUrl(`/events/${e.slug}`) }} />
      <PageHero eyebrow={TYPE[e.type]} title={e.title}>
        <p className="mt-6 font-sans text-lg text-white/80">{formatDate(e.startsAt, "day")}{!e.allDay && !e.timeTbc ? ` · ${formatTime(e.startsAt)}` : ""}{e.endsAt ? `–${formatTime(e.endsAt)}` : ""}</p>
        {e.venue && <p className="mt-1 font-sans text-white/60">{e.venue}{e.location ? `, ${e.location}` : ""}</p>}
      </PageHero>
      <div className="wrap grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-7">
          {future && <div className="mb-10 inline-block bg-royal p-6"><p className="eyebrow mb-3 text-gold">Starts in</p><Countdown to={e.startsAt.toISOString()} /></div>}
          {e.description ? <Markdown>{e.description}</Markdown> : <p className="text-ink-2">More details will follow.</p>}
          {e.dgVisits[0] && <Link href="/district-governor" className="link-arrow mt-6">About the Governor's visits</Link>}
          <div className="mt-10"><ShareButtons url={absUrl(`/events/${e.slug}`)} title={e.title} /></div>
        </div>
        <aside className="space-y-5 font-sans text-sm md:col-span-5">
          {e.imageUrl && (
            <a href={e.imageUrl} target="_blank" rel="noopener noreferrer" className="block border border-line" aria-label="Open the event flyer">
              <Img src={e.imageUrl} alt={`Flyer: ${e.title}`} width={1080} height={1080} priority sizes="(min-width: 768px) 40vw, 100vw" className="h-auto w-full" />
            </a>
          )}
          {e.organiser && <p><span className="eyebrow block text-muted">Organiser</span>{e.organiser}</p>}
          {e.registrationUrl && <a href={e.registrationUrl} className="btn btn-gold" target="_blank" rel="noopener noreferrer">Register ↗</a>}
          {e.sourceUrl && <p><span className="eyebrow block text-muted">Source</span><a href={e.sourceUrl} className="underline" target="_blank" rel="noopener noreferrer">{e.sourceLabel ?? e.sourceUrl} ↗</a></p>}
          {e.latitude && e.longitude && <MapView points={[{ kind: "event", title: e.venue ?? e.title, lat: e.latitude, lng: e.longitude }]} height={280} />}
        </aside>
      </div>
    </article>
  );
}
