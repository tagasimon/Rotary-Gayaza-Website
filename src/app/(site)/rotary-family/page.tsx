import type { Metadata } from "next";
import Link from "next/link";
import { buildFamilyNodes } from "@/lib/family";
import { getFamily, getHomeClub } from "@/lib/queries";
import { FamilyTree } from "@/components/site/FamilyTree";
import { Provenance } from "@/components/site/Provenance";

export const metadata: Metadata = { title: "Our Rotary Family", description: "The clubs that helped the Rotary Club of Gayaza take root, and the Interact and Rotaract clubs Gayaza has helped start. One club can create many more.", alternates: { canonical: "/rotary-family" } };

const REL_TEXT: Record<string, string> = {
  MOTHER_CLUB: "Mother club — formally sponsored the new club's charter",
  SUPPORTED: "Supported — gave practical help with formation or chartering",
  SPONSORED: "Sponsored — is the club's formal Rotary sponsor",
  MENTORED: "Mentored — provides ongoing guidance",
  CHARTERED: "Chartered — the new club was chartered through this club",
};

export default async function FamilyPage() {
  const [{ nodes, centre }, rels, home] = await Promise.all([buildFamilyNodes(), getFamily(), getHomeClub()]);
  return (
    <>
      <section className="bg-ink pb-20 pt-20 text-white sm:pt-28">
        <div className="wrap">
          <p className="eyebrow text-gold">Our Rotary family</p>
          <h1 className="mt-4 max-w-4xl text-6xl leading-[0.95] sm:text-8xl">Service grows.</h1>
          <p className="mt-6 max-w-2xl text-xl text-white/80">One club can create many more. These are the clubs that rooted Gayaza, the young clubs it has helped to grow, and the service and communities that link them.</p>
          <div className="mt-14"><FamilyTree nodes={nodes} centre={centre} /></div>
        </div>
      </section>
      <section className="py-20">
        <div className="wrap grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <h2 className="text-4xl">Every relationship, named precisely.</h2>
            <p className="mt-4 text-ink-2">Rotary relationships are not all the same, so we record each one as what it is.</p>
            <dl className="mt-6 space-y-3 text-sm">{Object.entries(REL_TEXT).map(([k, v]) => <div key={k}><dt className="chip">{k.replace("_", " ")}</dt><dd className="mt-1 text-ink-2">{v.split("—")[1]}</dd></div>)}</dl>
          </div>
          <ol className="space-y-px md:col-span-8">
            {rels.map((r) => {
              const other = r.childClubId === home.id ? r.parentClub : r.childClub;
              const direction = r.childClubId === home.id ? "Helped Gayaza" : "Gayaza helped";
              return (
                <li key={r.id} className="grid gap-3 border-t border-line py-6 sm:grid-cols-[160px_1fr]">
                  <div><span className="inline-block rounded-full bg-gold px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em]">{r.relationshipType.replace("_", " ")}</span><p className="mt-2 text-xs uppercase tracking-wider text-muted">{direction}{r.year ? ` · ${r.year}` : ""}</p></div>
                  <div>
                    <h3 className="text-2xl">{other.name}</h3>
                    <p className="text-sm text-muted">{{ ROTARY: "Rotary club", ROTARACT: "Rotaract club", INTERACT: "Interact club", ROTARY_COMMUNITY_CORPS: "Rotary Community Corps", OTHER: "Organisation" }[other.type]}{other.district ? ` · District ${other.district}` : ""}</p>
                    {r.description && <p className="mt-2 text-ink-2">{r.description}</p>}
                    {other.website && <a href={other.website} className="link-arrow mt-2 text-sm" target="_blank" rel="noopener noreferrer">Visit</a>}
                    <Provenance className="mt-2" label={r.sourceLabel} url={r.sourceUrl} verification={r.verification} />
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>
      <section className="bg-gold py-16"><div className="wrap flex flex-col items-start justify-between gap-6 md:flex-row md:items-center"><p className="display max-w-2xl text-4xl">Want to start an Interact or Rotaract club at your school or campus?</p><Link href="/contact?interest=new-club" className="btn bg-ink text-white hover:bg-royal-deep">Talk to us</Link></div></section>
    </>
  );
}
