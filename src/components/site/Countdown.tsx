"use client";
import { useEffect, useState } from "react";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

export function Countdown({ to, tone = "light" }: { to: string; tone?: "light" | "dark" }) {
  const target = new Date(to).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return <div className="h-[68px]" aria-hidden />;
  const diff = target - now;
  if (diff <= 0) return <p className={`eyebrow ${tone === "light" ? "text-gold" : "text-royal"}`}>Happening today</p>;
  const p = parts(diff);
  const cells: [number, string][] = [[p.d, "days"], [p.h, "hours"], [p.m, "min"], [p.s, "sec"]];
  return (
    <div className="flex gap-3 sm:gap-5" role="timer" aria-label={`${p.d} days, ${p.h} hours and ${p.m} minutes to go`}>
      {cells.map(([n, l]) => (
        <div key={l} className="min-w-[3.2rem] text-center">
          <div className={`font-sans text-3xl font-bold tabular-nums leading-none sm:text-4xl ${tone === "light" ? "text-white" : "text-ink"}`}>{String(n).padStart(2, "0")}</div>
          <div className={`mt-1.5 font-sans text-[0.6rem] font-bold uppercase tracking-[0.2em] ${tone === "light" ? "text-gold" : "text-royal"}`}>{l}</div>
        </div>
      ))}
    </div>
  );
}
