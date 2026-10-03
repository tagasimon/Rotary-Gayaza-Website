/** Eyebrow + Baskerville headline ending in a full stop, the house style. */
export function SectionHeading({ eyebrow, title, intro, tone = "dark", align = "left", id }: { num?: string; eyebrow?: string; title: string; intro?: string; tone?: "dark" | "light"; align?: "left" | "center"; id?: string }) {
  const light = tone === "light";
  return (
    <header className={`mb-10 sm:mb-14 ${align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}`}>
      {eyebrow && <p className={`eyebrow ${light ? "text-gold" : "text-royal"}`}>{eyebrow}</p>}
      <h2 id={id} className={`mt-2 text-[2rem] leading-[1.2] sm:text-[2.6rem] ${light ? "text-white" : "text-ink"}`}>{title}</h2>
      {intro && <p className={`mt-5 ${light ? "font-sans text-[1.05rem] leading-[1.85] text-white/60" : "lede"}`}>{intro}</p>}
      {align === "center" && <span className={`rule-short ${light ? "!bg-white/15" : ""}`} aria-hidden />}
    </header>
  );
}
