"use client";
import { useEffect, useRef, useState } from "react";

/** Shows the real value by default; counts up from zero only once it scrolls into view. */
export function CountUp({ display, to }: { display: string; to?: number | null }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState<string>(display);
  useEffect(() => {
    if (!to || to < 5 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const suffix = display.replace(/^[\d,.]+/, "");
    const el = ref.current!;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / 1200);
        setVal(Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString() + suffix);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [display, to]);
  return <span ref={ref} aria-label={display}><span aria-hidden>{val}</span></span>;
}
