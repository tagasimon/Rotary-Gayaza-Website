import type { Metadata } from "next";
import { getPresidents, getLeadership } from "@/lib/queries";
import { PageHero } from "@/components/site/PageHero";
import { Img } from "@/components/site/Img";
import { Provenance } from "@/components/site/Provenance";

export const metadata: Metadata = { title: "Leadership", description: "The current board and the presidents of the Rotary Club of Gayaza, Rotary year by Rotary year.", alternates: { canonical: "/leadership" } };

const initials = (n: string) => n.split(/\s+/).map((x) => x[0]).slice(0, 2).join("");

export default async function Leadership() {
  const [presidents, board] = await Promise.all([getPresidents(), getLeadership()]);
  const current = presidents.find((p) => p.isCurrent) ?? presidents[0];
  const past = presidents.filter((p) => p.id !== current?.id);
  return (
    <>
      <PageHero eyebrow="Leadership" title="One year at a time." intro="In Rotary, leadership changes hands every 1 July. Each president builds on the work of the last." />
      {current && (
        <section className="py-20">
          <div className="wrap grid gap-12 md:grid-cols-12">
            <div className="relative aspect-[4/5] overflow-hidden bg-royal md:col-span-5">
              {current.photoUrl ? <Img src={current.photoUrl} alt={current.name} fill sizes="40vw" className="object-cover" /> : <div className="absolute inset-0 grid place-items-center"><span className="display text-[9rem] text-gold">{initials(current.name)}</span><span className="absolute bottom-4 left-4 text-xs uppercase tracking-wider text-white/50">Portrait to come</span></div>}
            </div>
            <div className="md:col-span-7 md:pt-8">
              <p className="eyebrow text-soil">Club president · {current.rotaryYear}</p>
              <h2 className="mt-3 text-6xl">{current.name}</h2>
              {current.message && <blockquote className="display mt-8 border-l-2 border-gold pl-6 text-2xl italic leading-snug">“{current.message}”</blockquote>}
              {current.achievements.length > 0 && <ul className="mt-8 space-y-2">{current.achievements.map((a) => <li key={a} className="border-t border-line pt-2">{a}</li>)}</ul>}
              <Provenance className="mt-6" label={current.sourceLabel} url={current.sourceUrl} verification={current.verification} />
            </div>
          </div>
        </section>
      )}
      {board.length > 0 && (
        <section className="border-t border-line bg-paper-2 py-20">
          <div className="wrap">
            <h2 className="text-4xl">The board</h2>
            <p className="mt-2 text-sm text-muted">As listed by District 9213. Contact details are shared only where a member has chosen to make them public.</p>
            <ul className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {board.map((m) => (
                <li key={m.id} className="border-t-2 border-ink pt-4">
                  <div className="relative mb-4 aspect-square w-20 overflow-hidden rounded-full bg-royal">
                    {m.photoUrl ? <Img src={m.photoUrl} alt={m.fullName} fill sizes="80px" className="object-cover" /> : <span className="display absolute inset-0 grid place-items-center text-2xl text-gold">{initials(m.fullName)}</span>}
                  </div>
                  <p className="text-lg font-semibold">{m.fullName}</p>
                  <p className="text-sm text-ink-2">{m.rotaryRole}</p>
                  {m.showContactPublic && (m.email || m.phone) && <p className="mt-2 text-sm">{m.email && <a className="underline" href={`mailto:${m.email}`}>{m.email}</a>}{m.phone && <span className="block">{m.phone}</span>}</p>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      <section className="py-20">
        <div className="wrap">
          <h2 className="text-4xl">Presidents of the club</h2>
          {past.length === 0 ? (
            <p className="mt-4 max-w-xl text-ink-2">The club's presidential history from charter in 2021 onward is being compiled from club records and will appear here once confirmed.</p>
          ) : (
            <ol className="relative mt-12 flex gap-0 overflow-x-auto pb-6">
              <span aria-hidden className="absolute left-0 right-0 top-[9px] h-px bg-soil/60" />
              {[current, ...past].filter(Boolean).map((p) => (
                <li key={p!.id} className="relative w-64 shrink-0 pr-8 pt-8">
                  <span aria-hidden className="absolute left-0 top-[3px] h-3.5 w-3.5 rounded-full bg-soil" />
                  <p className="text-sm font-semibold tabular-nums text-soil">{p!.rotaryYear}</p>
                  <p className="display mt-1 text-2xl">{p!.name}</p>
                  {p!.achievements.slice(0, 3).map((a) => <p key={a} className="mt-1 text-sm text-ink-2">{a}</p>)}
                  {p!.archiveLinks.map((l) => <a key={l} href={l} className="mt-1 block text-xs underline" target="_blank" rel="noopener noreferrer">Archive ↗</a>)}
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </>
  );
}
