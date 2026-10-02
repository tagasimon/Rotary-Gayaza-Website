import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAlbum } from "@/lib/queries";
import { Gallery } from "@/components/site/Gallery";
import { Provenance } from "@/components/site/Provenance";
import { formatDate } from "@/lib/time";

type P = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const a = await getAlbum((await params).slug);
  return a ? { title: a.album.title, description: a.album.description ?? undefined, openGraph: { images: a.album.coverUrl ? [a.album.coverUrl] : undefined } } : {};
}

export default async function AlbumPage({ params, searchParams }: P) {
  const page = Math.max(1, parseInt((await searchParams).page ?? "1", 10) || 1);
  const data = await getAlbum((await params).slug, page, 24);
  if (!data) notFound();
  const { album, media, total, pages } = data;
  return (
    <section className="py-16">
      <div className="wrap">
        <Link href="/gallery" className="link-arrow text-sm">All albums</Link>
        <h1 className="mt-6 text-5xl sm:text-6xl">{album.title}</h1>
        <p className="mt-3 text-ink-2">{album.date ? formatDate(album.date) + " · " : ""}{total} photographs</p>
        {album.description && <p className="lede mt-4 max-w-2xl">{album.description}</p>}
        <Provenance className="mt-3" label={album.sourceLabel} url={album.sourceUrl} />
        <div className="mt-10"><Gallery photos={media} /></div>
        {pages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Album pages">
            {page > 1 && <Link className="btn btn-line" href={`?page=${page - 1}`}>← Previous</Link>}
            <span className="text-sm text-muted">Page {page} of {pages}</span>
            {page < pages && <Link className="btn btn-line" href={`?page=${page + 1}`}>More photos →</Link>}
          </nav>
        )}
      </div>
    </section>
  );
}
