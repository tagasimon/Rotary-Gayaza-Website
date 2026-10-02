import { Img } from "./Img";

export function PageHero({ eyebrow, title, intro, image, imageAlt = "", children }: { eyebrow: string; title: string; intro?: string | null; image?: string | null; imageAlt?: string; children?: React.ReactNode }) {
  if (image) {
    return (
      <section className="relative isolate -mt-px flex min-h-[64svh] items-end overflow-hidden bg-ink text-white">
        <Img src={image} alt={imageAlt} fill priority sizes="100vw" className="-z-10 object-cover" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(15,27,45,.25),rgba(15,27,45,.9))]" />
        <div className="wrap pb-14 pt-32">
          <p className="eyebrow text-gold">{eyebrow}</p>
          <h1 className="mt-4 max-w-4xl text-5xl leading-[0.98] sm:text-7xl">{title}</h1>
          {intro && <p className="mt-5 max-w-2xl text-lg text-white/85 sm:text-xl">{intro}</p>}
          {children}
        </div>
      </section>
    );
  }
  return (
    <section className="border-b border-line pb-14 pt-16 sm:pb-20 sm:pt-24">
      <div className="wrap">
        <p className="eyebrow text-soil"><span className="mr-2 inline-block h-px w-6 bg-soil align-middle" aria-hidden />{eyebrow}</p>
        <h1 className="mt-5 max-w-5xl text-5xl leading-[0.98] sm:text-7xl lg:text-8xl">{title}</h1>
        {intro && <p className="lede mt-6 max-w-2xl">{intro}</p>}
        {children}
      </div>
    </section>
  );
}
