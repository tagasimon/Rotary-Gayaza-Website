import Link from "next/link";
import type { Club } from "@prisma/client";
import { Wordmark } from "./Wordmark";

const LINKS = [
  ["/our-story", "Our Story"], ["/projects", "Projects"], ["/impact", "Impact"], ["/events", "Events"],
  ["/rotary-family", "Rotary Family"], ["/stories", "News & stories"], ["/district-governor", "Governor's Visits"], ["/leadership", "Leadership"],
  ["/gallery", "Photographs"], ["/contact", "Contact"], ["/attend", "Meeting sign-in"],
] as const;

export function Footer({ club }: { club: Club }) {
  return (
    <footer className="band-royal relative overflow-hidden text-white/80">
      {/* roots motif */}
      <svg aria-hidden className="pointer-events-none absolute -top-px left-0 h-24 w-full text-gold/40" viewBox="0 0 1200 100" preserveAspectRatio="none">
        <path d="M600 0 C600 40 520 50 420 70 S240 95 0 100 M600 0 C600 40 680 50 780 70 S960 95 1200 100 M600 0 C 610 50 600 70 640 100 M600 0 C590 50 560 80 520 100" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
      <div className="wrap grid gap-12 pb-12 pt-24 md:grid-cols-12">
        <div className="md:col-span-4">
          <Wordmark logoUrl={club.logoUrl} tone="light" />
          <p className="serif mt-5 max-w-xs text-sm leading-relaxed">Gayaza, Uganda · Rotary District {club.district}</p>
          <p className="mt-6 text-sm">
            <span className="eyebrow block text-gold">We meet</span>
            <span className="mt-1 block font-semibold text-white">{club.meetingDay}s at {club.meetingTime}</span>
            <span className="block">{club.venue}</span>
            {club.address && <span className="block text-white/65">{club.address}</span>}
          </p>
          <Link href="/attend" className="btn btn-gold mt-6 !min-h-0 !py-2.5">Meeting sign-in</Link>
        </div>
        <nav aria-label="Footer" className="md:col-span-5">
          <p className="eyebrow text-gold">Explore</p>
          <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {LINKS.map(([href, label]) => <li key={href}><Link href={href} className="hover:text-gold">{label}</Link></li>)}
          </ul>
        </nav>
        <div className="space-y-2 text-sm md:col-span-3">
          <p className="eyebrow text-gold">Elsewhere</p>
          {club.xUrl && <p><a href={club.xUrl} className="hover:text-gold" target="_blank" rel="noopener noreferrer">X · @Rcgayaza ↗</a></p>}
          {club.email && <p><a href={`mailto:${club.email}`} className="break-all hover:text-gold">{club.email}</a></p>}
          <p><a href="https://rotaryd9213.org/" className="hover:text-gold" target="_blank" rel="noopener noreferrer">Rotary District 9213 ↗</a></p>
          <p><a href="https://www.rotary.org/" className="hover:text-gold" target="_blank" rel="noopener noreferrer">Rotary International ↗</a></p>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="wrap flex flex-col justify-between gap-2 py-6 text-xs text-white/60 sm:flex-row">
          <p>© {new Date().getFullYear()} Rotary Club of Gayaza. Service Above Self.</p>
          <p>Facts on this site link to their sources. Spotted an error? <Link href="/contact?interest=correction" className="underline hover:text-gold">Tell us</Link> · <Link href="/admin" className="hover:text-gold">Club admin</Link></p>
        </div>
      </div>
    </footer>
  );
}
