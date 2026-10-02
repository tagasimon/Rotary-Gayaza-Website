export function SectionHeading({ num, eyebrow, title, intro, tone = "dark", id }: { num?: string; eyebrow: string; title: string; intro?: string; tone?: "dark" | "light"; id?: string }) {
  const light = tone === "light";
  return (
    <header className="mb-10 grid gap-4 sm:mb-14 md:grid-cols-12 md:gap-8">
      <p className={`eyebrow md:col-span-3 md:pt-3 ${light ? "text-gold" : "text-soil"}`}>
        {num && <span className="mr-2 tabular-nums">{num}</span>}
        <span className={`mr-2 inline-block h-px w-6 align-middle ${light ? "bg-gold" : "bg-soil"}`} aria-hidden />
        {eyebrow}
      </p>
      <div className="md:col-span-9">
        <h2 id={id} className={`text-4xl leading-[1.05] sm:text-5xl lg:text-6xl ${light ? "text-white" : "text-ink"}`}>{title}</h2>
        {intro && <p className={`mt-5 max-w-2xl text-lg leading-relaxed ${light ? "text-white/80" : "text-ink-2"}`}>{intro}</p>}
      </div>
    </header>
  );
}
