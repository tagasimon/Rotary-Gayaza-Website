"use client";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

export type GalleryPhoto = { id: string; url: string; thumbUrl?: string | null; alt?: string | null; caption?: string | null; credit?: string | null; width?: number | null; height?: number | null };

/** Editorial grid + full-screen lightbox with keyboard and swipe support. */
export function Gallery({ photos, layout = "editorial" }: { photos: GalleryPhoto[]; layout?: "editorial" | "grid" }) {
  const [idx, setIdx] = useState<number | null>(null);
  const close = useCallback(() => setIdx(null), []);
  const go = useCallback((d: number) => setIdx((i) => (i === null ? i : (i + d + photos.length) % photos.length)), [photos.length]);

  useEffect(() => {
    if (idx === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [idx, close, go]);

  const spans = ["col-span-2 row-span-2", "", "", "row-span-2", "", "col-span-2", "", ""];
  let touchX = 0;
  return (
    <>
      <ul className={layout === "editorial" ? "grid auto-rows-[140px] grid-cols-2 gap-2 sm:auto-rows-[180px] md:grid-cols-4" : "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"}>
        {photos.map((p, i) => (
          <li key={p.id} className={layout === "editorial" ? spans[i % spans.length] : "aspect-[4/3]"}>
            <button type="button" onClick={() => setIdx(i)} className="group relative block h-full w-full overflow-hidden bg-paper-2" aria-label={`Open photo: ${p.alt ?? "photograph"}`}>
              <Image src={p.thumbUrl || p.url} alt={p.alt ?? ""} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover transition-transform duration-700 ease-[var(--ease-story)] group-hover:scale-[1.04]" loading="lazy" />
            </button>
          </li>
        ))}
      </ul>
      {idx !== null && (
        <div role="dialog" aria-modal="true" aria-label="Photo viewer" className="fixed inset-0 z-[60] flex flex-col bg-royal-ink/95 text-white"
          onTouchStart={(e) => (touchX = e.touches[0].clientX)} onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - touchX; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); }}>
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="tabular-nums text-white/60">{idx + 1} / {photos.length}</span>
            <button type="button" onClick={close} className="h-11 rounded-full px-4 font-semibold hover:text-gold" autoFocus>Close ✕</button>
          </div>
          <div className="relative flex-1">
            <Image src={photos[idx].url} alt={photos[idx].alt ?? ""} fill sizes="100vw" className="object-contain" priority />
            <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className="absolute left-2 top-1/2 h-14 w-14 -translate-y-1/2 rounded-full bg-white/10 text-2xl hover:bg-white/20">‹</button>
            <button type="button" onClick={() => go(1)} aria-label="Next photo" className="absolute right-2 top-1/2 h-14 w-14 -translate-y-1/2 rounded-full bg-white/10 text-2xl hover:bg-white/20">›</button>
          </div>
          <div className="px-4 py-4 text-center text-sm text-white/75">
            {photos[idx].caption || photos[idx].alt}
            {photos[idx].credit && <span className="ml-2 text-white/45">Photo: {photos[idx].credit}</span>}
          </div>
        </div>
      )}
    </>
  );
}
