"use client";
import { useEffect, useRef, useState } from "react";

/** Counts up to `to` when visible, keeping any suffix from `display` (e.g. "600+"). Respects reduced motion. */
export function CountUp({ display, to }: { display: string; to?: number | null }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState<string>(display);
  useEffect(() => {
    if (!to || to < 5) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const suffix = display.replace(/^[\d,.]+/, "");
    setVal("0" + suffix);
    const el = ref.current!;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const dur = 1400;
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(to * eased).toLocaleString() + suffix);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [display, to]);
  return <span ref={ref} aria-label={display}><span aria-hidden>{val}</span></span>;
}
