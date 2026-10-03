import type { Metadata } from "next";
import Link from "next/link";
import { getPublicMembers } from "@/lib/queries";
import { PageHero } from "@/components/site/PageHero";
import { Img } from "@/components/site/Img";

export const metadata: Metadata = { title: "Our People", description: "Members of the Rotary Club of Gayaza who have chosen to appear publicly.", alternates: { canonical: "/members" } };

export default async function Members() {
  const members = await getPublicMembers();
  return (
    <>
      <PageHero eyebrow="Our people" title="The faces behind the service." intro="Members appear here only if they have chosen to. Private contact details are never shown unless a member asks us to." />
      <section className="py-16">
        <div className="wrap">
          <ul className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
            {members.map((m) => (
              <li key={m.id} className="flex gap-4 bg-paper p-6">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-royal">
                  {m.photoUrl ? <Img src={m.photoUrl} alt={m.fullName} fill sizes="64px" className="object-cover" /> : <span className="display absolute inset-0 grid place-items-center text-xl text-gold">{m.fullName.split(" ").map((x) => x[0]).slice(0, 2).join("")}</span>}
                </div>
                <div>
                  <p className="text-lg font-semibold">{m.fullName}</p>
                  {m.rotaryRole && <p className="text-sm text-ink-2">{m.rotaryRole}</p>}
                  {m.bio && <p className="mt-2 text-sm text-ink-2">{m.bio}</p>}
                  {m.showContactPublic && m.email && <a href={`mailto:${m.email}`} className="mt-1 block text-sm underline">{m.email}</a>}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-ink-2">Signing in at a meeting? <Link href="/attend" className="link-arrow">Meeting sign-in</Link></p>
        </div>
      </section>
    </>
  );
}
