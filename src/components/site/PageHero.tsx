import { Img } from "./Img";

export function PageHero({ eyebrow, title, intro, image, imageAlt = "", children }: { eyebrow: string; title: string; intro?: string | null; image?: string | null; imageAlt?: string; children?: React.ReactNode }) {
  if (image) {
    return (
      <section className="relative isolate -mt-px flex min-h-[60svh] items-end overflow-hidden bg-royal-deep text-white">
        <Img src={image} alt={imageAlt} fill priority sizes="100vw" className="-z-10 object-cover" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(15,52,116,.25),rgba(11,42,92,.92))]" />
        <div className="wrap pb-14 pt-32">
          <p className="eyebrow text-gold">{eyebrow}</p>
          <h1 className="mt-4 max-w-4xl text-5xl leading-[1.02] sm:text-7xl">{title}</h1>
          {intro && <p className="serif mt-5 max-w-2xl text-lg text-white/85 sm:text-xl">{intro}</p>}
          {children}
        </div>
      </section>
    );
  }
  return (
    <section className="relative overflow-hidden border-b border-line pb-14 pt-16 sm:pb-20 sm:pt-24">
      <span aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-mist" />
      <div className="wrap relative">
        <p className="eyebrow text-azure"><span className="mr-2 inline-block h-[2px] w-6 bg-gold align-middle" aria-hidden />{eyebrow}</p>
        <h1 className="mt-5 max-w-5xl text-5xl leading-[1.02] text-royal sm:text-7xl">{title}</h1>
        {intro && <p className="lede mt-6 max-w-2xl">{intro}</p>}
        {children}
      </div>
    </section>
  );
}
