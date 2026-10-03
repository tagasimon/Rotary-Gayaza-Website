import { Img } from "./Img";

/** Dark photographic hero, as on the homepage: eyebrow, Baskerville title, grey lead. */
export function PageHero({ eyebrow, title, intro, image, imageAlt = "", children }: { eyebrow: string; title: string; intro?: string | null; image?: string | null; imageAlt?: string; children?: React.ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden bg-night text-white">
      {image && <Img src={image} alt={imageAlt} fill priority sizes="100vw" className="-z-10 object-cover opacity-35" />}
      <div className="wrap py-20 sm:py-28">
        <p className="eyebrow text-white/55">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl text-[2.4rem] leading-[1.15] sm:text-[3.3rem]">{title}</h1>
        {intro && <p className="mt-6 max-w-2xl font-sans text-[1.05rem] leading-[1.85] text-white/65">{intro}</p>}
        {children}
      </div>
    </section>
  );
}
