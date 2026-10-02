"use client";
import { useEffect, useRef, type ReactNode, type ElementType } from "react";

/**
 * Scroll reveal without hiding content from no-JS visitors or crawlers:
 * elements are only hidden when <html class="js"> is set, and revealed by IntersectionObserver.
 */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { el.classList.add("in"); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add("in"); io.disconnect(); } }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

export function Reveal({ children, delay = 0, className = "", as = "div" }: { children: ReactNode; delay?: number; y?: number; className?: string; as?: "div" | "li" | "section" }) {
  const ref = useReveal<HTMLElement>();
  const Tag = as as ElementType;
  return <Tag ref={ref} data-reveal="" className={className} style={{ transitionDelay: `${delay}s` }}>{children}</Tag>;
}

export function ImageReveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useReveal<HTMLDivElement>();
  return <div ref={ref} data-reveal-img="" className={className}>{children}</div>;
}
