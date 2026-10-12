export function SectionHeading({ num, eyebrow, title, intro, tone = "dark", id, align, kinetic = false }: { num?: string; eyebrow?: string; title: string; intro?: string; tone?: "dark" | "light"; id?: string; align?: "left" | "center"; kinetic?: boolean }) {
  const light = tone === "light";
  // scrollcraft: assemble the headline line by line as its section scrolls in (needs a data-sc-act ancestor)
  const k = kinetic ? { "data-sc-cue": "0.06", "data-sc-kinetic": "lines" } : {};
  if (align === "center") {
    return (
      <header className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
        {eyebrow && <p className={`eyebrow ${light ? "text-gold" : "text-azure"}`}>{num && <span className="mr-2 tabular-nums">{num}</span>}{eyebrow}</p>}
        <h2 id={id} {...k} className={`mt-3 text-4xl leading-[1.08] sm:text-5xl ${light ? "text-white" : "text-royal"}`}>{title}</h2>
        {intro && <p className={`serif mt-5 text-lg leading-relaxed ${light ? "text-white/80" : "text-ink-2"}`}>{intro}</p>}
      </header>
    );
  }
  return (
    <header className="mb-10 grid gap-4 sm:mb-14 md:grid-cols-12 md:gap-8">
      <p className={`eyebrow md:col-span-3 md:pt-3 ${light ? "text-gold" : "text-azure"}`}>
        {num && <span className="mr-2 tabular-nums">{num}</span>}
        <span className="mr-2 inline-block h-[2px] w-6 bg-gold align-middle" aria-hidden />
        {eyebrow}
      </p>
      <div className="md:col-span-9">
        <h2 id={id} {...k} className={`text-4xl leading-[1.05] sm:text-5xl lg:text-6xl ${light ? "text-white" : "text-royal"}`}>{title}</h2>
        {intro && <p className={`serif mt-5 max-w-2xl text-lg leading-relaxed ${light ? "text-white/80" : "text-ink-2"}`}>{intro}</p>}
      </div>
    </header>
  );
}
