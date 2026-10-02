import type { Metadata } from "next";
import Link from "next/link";
import { getAlbums } from "@/lib/queries";
import { PageHero } from "@/components/site/PageHero";
import { Img } from "@/components/site/Img";
import { formatDate } from "@/lib/time";

export const metadata: Metadata = { title: "Photographs", description: "Photo albums from Rotary Club of Gayaza projects, fellowships and District Governor visits.", alternates: { canonical: "/gallery" } };
const KIND: Record<string, string> = { PROJECT: "Project", DG_VISIT: "Governor's visit", FELLOWSHIP: "Fellowship", LEADERSHIP: "Leadership", EVENT: "Event", ARCHIVE: "Archive", GENERAL: "Album" };

export default async function GalleryIndex() {
  const albums = await getAlbums();
  return (
    <>
      <PageHero eyebrow="Photographs" title="The archive, in pictures." intro="Real club photography, credited to whoever took it." />
      <section className="py-16"><div className="wrap grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {albums.map((a, i) => (
          <Link key={a.id} href={`/gallery/${a.slug}`} className={`group ${i === 0 ? "sm:col-span-2" : ""}`}>
            <div className={`relative overflow-hidden bg-paper-2 ${i === 0 ? "aspect-[16/9]" : "aspect-[4/3]"}`}><Img src={a.coverUrl} alt="" fill sizes="(min-width:640px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" /></div>
            <p className="eyebrow mt-4 text-soil">{KIND[a.kind]}{a.date ? ` · ${formatDate(a.date, "short")}` : ""} · {a._count.media} photos</p>
            <h2 className="mt-1 text-2xl group-hover:text-royal">{a.title}</h2>
          </Link>
        ))}
        {albums.length === 0 && <p className="text-ink-2">Albums are on their way.</p>}
      </div></section>
    </>
  );
}
