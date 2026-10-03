import Link from "next/link";
import type { Club } from "@prisma/client";
import { Wordmark } from "./Wordmark";

const LINKS = [
  ["/our-story", "Our story"], ["/projects", "Our work"], ["/impact", "Impact"], ["/events", "Events"],
  ["/rotary-family", "Rotary family"], ["/stories", "News"], ["/district-governor", "Governor's visits"], ["/leadership", "Leadership"],
  ["/gallery", "Photographs"], ["/contact", "Contact"], ["/attend", "Fellowship sign-in"],
] as const;

export function Footer({ club }: { club: Club }) {
  return (
    <footer className="bg-night font-sans text-white/50">
      <div className="wrap grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <Wordmark tone="light" />
          <p className="mt-5 text-sm leading-relaxed">Gayaza, Uganda · Rotary District {club.district}<br />Service Above Self.</p>
        </div>
        <div className="md:col-span-3">
          <p className="eyebrow text-white/80">Fellowship</p>
          <p className="mt-3 text-sm leading-relaxed">Every {club.meetingDay}, {club.meetingTime}<br />{club.venue}<br />{club.address}</p>
        </div>
        <nav aria-label="Footer" className="md:col-span-3">
          <p className="eyebrow text-white/80">Explore</p>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">{LINKS.map(([href, label]) => <li key={href}><Link href={href} className="hover:text-white">{label}</Link></li>)}</ul>
        </nav>
        <div className="text-sm md:col-span-2">
          <p className="eyebrow text-white/80">Connect</p>
          <ul className="mt-3 space-y-1.5">
            {club.xUrl && <li><a href={club.xUrl} className="hover:text-white" target="_blank" rel="noopener noreferrer">X · @Rcgayaza</a></li>}
            {club.email && <li><a href={`mailto:${club.email}`} className="break-all hover:text-white">{club.email}</a></li>}
            <li><a href="https://rotaryd9213.org/" className="hover:text-white" target="_blank" rel="noopener noreferrer">District 9213</a></li>
            <li><a href="https://www.rotary.org/" className="hover:text-white" target="_blank" rel="noopener noreferrer">Rotary International</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="wrap flex flex-col justify-between gap-2 py-6 text-xs sm:flex-row">
          <p>© {new Date().getFullYear()} Rotary Club of Gayaza.</p>
          <p><Link href="/admin" className="hover:text-white">Club admin</Link> · <Link href="/contact?interest=correction" className="hover:text-white">Report a correction</Link></p>
        </div>
      </div>
    </footer>
  );
}
