import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PageTitle, Pager } from "@/components/admin/ui";
import { UploadForm } from "@/components/admin/UploadForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { deleteMedia } from "./actions";

export const metadata = { title: "Media library" };
const PER = 48;

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ album?: string; page?: string; noalt?: string }> }) {
  await requireAdmin("media");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = { ...(sp.album ? { albumId: sp.album } : {}), ...(sp.noalt ? { OR: [{ alt: null }, { alt: "" }] } : {}) };
  const [albums, media, total] = await Promise.all([
    db.album.findMany({ orderBy: { date: "desc" }, include: { _count: { select: { media: true } } } }),
    db.media.findMany({ where, orderBy: [{ createdAt: "desc" }, { order: "asc" }], skip: (page - 1) * PER, take: PER }),
    db.media.count({ where }),
  ]);
  return (
    <>
      <PageTitle title="Media library" subtitle="Real club photography. Every image needs alt text describing what is visible." actions={<><Link href="/admin/content/albums/new" className="btn btn-line !min-h-0 !py-2">New album</Link><Link href="/admin/content/albums" className="btn btn-line !min-h-0 !py-2">Manage albums</Link></>} />
      <div className="card mb-5 p-4"><UploadForm albums={albums.map((a) => ({ id: a.id, title: a.title }))} /></div>
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link href="/admin/media" className={`chip ${!sp.album && !sp.noalt ? "border-ink" : ""}`}>All · {total}</Link>
        <Link href="/admin/media?noalt=1" className={`chip ${sp.noalt ? "border-ink" : ""}`}>Missing alt text</Link>
        {albums.map((a) => <Link key={a.id} href={`/admin/media?album=${a.id}`} className={`chip ${sp.album === a.id ? "border-ink" : ""}`}>{a.title} · {a._count.media}</Link>)}
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
        {media.map((m) => (
          <li key={m.id} className="card overflow-hidden">
            <Link href={`/admin/content/media/${m.id}`} className="block aspect-[4/3] bg-paper-2">
              {m.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.thumbUrl ?? m.url} alt={m.alt ?? ""} loading="lazy" className="h-full w-full object-cover" />
              ) : <span className="grid h-full place-items-center text-xs uppercase text-muted">{m.kind}</span>}
            </Link>
            <div className="p-2 text-xs"><p className={`line-clamp-2 ${m.alt ? "" : "font-semibold text-soil"}`}>{m.alt || "No alt text"}</p>
              <div className="mt-1 flex justify-between"><Link href={`/admin/content/media/${m.id}`} className="underline">Edit</Link><ConfirmButton action={deleteMedia.bind(null, m.id)} label="Delete" confirmText="Sure?" /></div></div>
          </li>
        ))}
      </ul>
      <Pager page={page} pages={Math.ceil(total / PER)} base={`/admin/media?${new URLSearchParams(Object.entries({ album: sp.album, noalt: sp.noalt }).filter(([, v]) => v) as [string, string][])}`} />
    </>
  );
}
