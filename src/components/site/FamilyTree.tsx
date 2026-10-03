"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export type FamilyGroup = "roots" | "youth" | "projects" | "communities" | "partners" | "future";
export type FamilyNode = {
  id: string;
  label: string;
  short?: string;
  group: FamilyGroup;
  kind: string; // "Rotary club", "Interact club", "Project", "Community"…
  relationship?: string; // MOTHER CLUB / SUPPORTED / SPONSORED / MENTORED / CHARTERED
  year?: string | null;
  story?: string | null;
  href?: string | null;
  invite?: boolean; // an open invitation, drawn dashed
  pending?: boolean; // awaiting confirmation by the club
};

type Lay = { mode: "col" | "row"; at: number; from: number; to: number };
const GROUPS: Record<FamilyGroup, { title: string; color: string; lay: Lay; label: [number, number, "start" | "middle" | "end"] }> = {
  future: { title: "New growth", color: "#F7A81B", lay: { mode: "row", at: 70, from: 420, to: 580 }, label: [500, 28, "middle"] },
  projects: { title: "Service projects", color: "#00A2E0", lay: { mode: "col", at: 735, from: 70, to: 300 }, label: [735, 38, "start"] },
  communities: { title: "Communities", color: "#FF7600", lay: { mode: "col", at: 715, from: 410, to: 480 }, label: [715, 385, "start"] },
  youth: { title: "Clubs we helped start", color: "#8EC5FF", lay: { mode: "col", at: 265, from: 100, to: 300 }, label: [265, 68, "end"] },
  partners: { title: "Partners", color: "#C9D6EE", lay: { mode: "col", at: 285, from: 420, to: 470 }, label: [285, 395, "end"] },
  roots: { title: "Our roots", color: "#E2734A", lay: { mode: "row", at: 575, from: 400, to: 600 }, label: [500, 640, "middle"] },
};
const ORDER: FamilyGroup[] = ["roots", "youth", "future", "projects", "communities", "partners"];

const W = 1000, H = 660, CX = W / 2, CY = 330;


function layout(nodes: FamilyNode[]) {
  const pos = new Map<string, { x: number; y: number; d: string; anchor: "start" | "middle" | "end"; labelPos: "side" | "above" | "below" }>();
  for (const g of ORDER) {
    const items = nodes.filter((n) => n.group === g);
    const L = GROUPS[g].lay;
    items.forEach((n, i) => {
      const t = items.length === 1 ? 0.5 : i / (items.length - 1);
      const v = Math.round(L.from + (L.to - L.from) * t);
      const x = L.mode === "col" ? L.at : v, y = L.mode === "col" ? v : L.at;
      const d = L.mode === "col"
        ? `M ${CX} ${CY} C ${CX + (x - CX) * 0.35} ${CY}, ${CX + (x - CX) * 0.55} ${y}, ${x} ${y}`
        : `M ${CX} ${CY} C ${CX} ${CY + (y - CY) * 0.45}, ${x} ${CY + (y - CY) * 0.5}, ${x} ${y}`;
      const anchor = L.mode === "row" ? "middle" : x > CX ? "start" : "end";
      pos.set(n.id, { x, y, d, anchor, labelPos: L.mode === "col" ? "side" : y < CY ? "above" : "below" });
    });
  }
  return pos;
}

const trunc = (s: string) => (s.length > 26 ? s.slice(0, 25).trimEnd() + "…" : s);

function RelChip({ rel }: { rel?: string }) {
  if (!rel) return null;
  return <span className="inline-block rounded-full bg-gold px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink">{rel.replace("_", " ")}</span>;
}

export function FamilyTree({ nodes, centre }: { nodes: FamilyNode[]; centre: { title: string; story: string; year?: string } }) {
  const [active, setActive] = useState<FamilyNode | null>(null);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pos = useMemo(() => layout(nodes), [nodes]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fallback = setTimeout(() => setVisible(true), 2500); // never leave the tree hidden
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setVisible(true), io.disconnect()), { threshold: 0.01, rootMargin: "0px 0px -10% 0px" });
    io.observe(el);
    return () => { io.disconnect(); clearTimeout(fallback); };
  }, []);

  const groupsPresent = ORDER.filter((g) => nodes.some((n) => n.group === g));
  const detail = active ?? null;

  return (
    <div ref={ref}>
      {/* ── Desktop: living network ─────────────────────────────── */}
      <div className={`hidden gap-8 lg:grid lg:grid-cols-[1fr_300px] lg:items-center ${visible ? "is-visible" : ""}`}>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="group" aria-label="Rotary family network. Use Tab to move between clubs, projects and communities.">
          <defs>
            <radialGradient id="glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F7A81B" stopOpacity=".35" />
              <stop offset="100%" stopColor="#F7A81B" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* ground line */}
          <line x1="40" x2={W - 40} y1={CY + 64} y2={CY + 64} stroke="currentColor" className="text-white/10" strokeDasharray="2 6" />

          {/* branch group labels */}
          {groupsPresent.map((g) => {
            const [x, y, anchor] = GROUPS[g].label;
            return (
              <text key={g} x={x} y={y} textAnchor={anchor} className="text-[12px] font-semibold uppercase tracking-[0.25em] transition-opacity duration-700" style={{ opacity: visible ? 1 : 0, fill: GROUPS[g].color }}>{GROUPS[g].title}</text>
            );
          })}

          {/* branches */}
          {nodes.map((n, i) => {
            const p = pos.get(n.id)!;
            const d = p.d;
            const isActive = active?.id === n.id;
            return (
              <path key={n.id + "-p"} d={d} fill="none" stroke={GROUPS[n.group].color}
                strokeWidth={isActive ? 2.5 : n.group === "roots" ? 2 : 1.25}
                strokeDasharray={n.invite ? "4 6" : undefined}
                className={n.invite ? "" : "draw-path"}
                style={{ ["--len" as string]: 700, transitionDelay: `${0.15 + i * 0.06}s`, opacity: active && !isActive ? 0.35 : 0.9 }} />
            );
          })}

          {/* centre */}
          <circle cx={CX} cy={CY} r="120" fill="url(#glow)" />
          <g tabIndex={0} role="button" aria-label={`${centre.title}. ${centre.story}`} onFocus={() => setActive(null)} onMouseEnter={() => setActive(null)} className="cursor-default outline-none">
            <circle cx={CX} cy={CY} r="68" className="fill-royal" stroke="#F7A81B" strokeWidth="3" />
            <text x={CX} y={CY - 6} textAnchor="middle" className="fill-gold text-[10px] font-semibold uppercase tracking-[0.2em]">Rotary Club of</text>
            <text x={CX} y={CY + 18} textAnchor="middle" className="fill-white text-[24px]" style={{ fontFamily: "var(--font-display)" }}>Gayaza</text>
          </g>

          {/* nodes */}
          {nodes.map((n, i) => {
            const p = pos.get(n.id)!;
            const isActive = active?.id === n.id;
            const r = n.group === "roots" || n.group === "youth" ? 11 : 8;
            const side = p.labelPos === "side";
            const lx = side ? p.x + (p.anchor === "start" ? r + 8 : -(r + 8)) : p.x;
            const ly = side ? p.y + 4.5 : p.labelPos === "below" ? p.y + r + 20 : p.y - r - 10;
            return (
              <g key={n.id} tabIndex={0} role="button" aria-label={`${n.label}. ${n.kind}${n.relationship ? `, ${n.relationship.toLowerCase()}` : ""}${n.year ? `, ${n.year}` : ""}`}
                onMouseEnter={() => setActive(n)} onFocus={() => setActive(n)}
                onClick={() => setActive(n)}
                onKeyDown={(e) => { if (e.key === "Enter" && n.href) window.location.href = n.href; }}
                className="cursor-pointer outline-none transition-opacity duration-700"
                style={{ opacity: visible ? (active && !isActive ? 0.55 : 1) : 0, transitionDelay: visible && !active ? `${0.6 + i * 0.07}s` : "0s" }}>
                {n.group === "future" && !n.invite && <circle cx={p.x} cy={p.y} r={r} fill="#F7A81B" className="pulse-ring" style={{ transformOrigin: `${p.x}px ${p.y}px` }} />}
                <circle cx={p.x} cy={p.y} r={isActive ? r + 4 : r} fill={n.invite ? "transparent" : GROUPS[n.group].color}
                  stroke={n.invite ? GROUPS[n.group].color : isActive ? "#fff" : "rgba(255,255,255,.35)"} strokeWidth={n.invite ? 1.5 : 2} strokeDasharray={n.invite ? "3 3" : undefined} />
                <text x={lx} y={ly} textAnchor={p.anchor}
                  className={`text-[14px] ${isActive ? "fill-gold" : "fill-white/85"}`} style={{ fontWeight: isActive ? 700 : 500 }}>
                  {trunc(n.short || n.label)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* detail card */}
        <aside aria-live="polite" className="min-h-[260px] self-center border-l border-white/15 py-2 pl-6 text-white">
          {detail ? (
            <>
              <p className="eyebrow text-gold">{GROUPS[detail.group].title}</p>
              <h3 className="mt-2 text-2xl leading-tight">{detail.label}</h3>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/70">
                <span>{detail.kind}</span>
                {detail.year && <span>· {detail.year}</span>}
                <RelChip rel={detail.relationship} />
                {detail.pending && <span className="rounded-full border border-white/25 px-2 py-0.5 text-[0.62rem] uppercase tracking-wider">Club records</span>}
              </div>
              {detail.story && <p className="mt-3 text-sm leading-relaxed text-white/80">{detail.story}</p>}
              {detail.href && <Link href={detail.href} className="mt-4 inline-block text-sm font-semibold text-gold hover:underline">{detail.invite ? "Start the conversation →" : "Read more →"}</Link>}
            </>
          ) : (
            <>
              <p className="eyebrow text-gold">The trunk{centre.year ? ` · ${centre.year}` : ""}</p>
              <h3 className="mt-2 text-2xl leading-tight">{centre.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/80">{centre.story}</p>
              <p className="mt-4 text-xs text-white/50">Hover over or tab to any node to explore.</p>
            </>
          )}
        </aside>
      </div>

      {/* ── Mobile: vertical lineage ─────────────────────────────── */}
      <ol className="lg:hidden" aria-label="Rotary family lineage">
        {(["roots", "centre", "youth", "projects", "communities", "partners", "future"] as const).map((g) => {
          if (g === "centre") {
            return (
              <li key="centre" className="relative my-2 rounded-sm bg-royal p-5 text-white">
                <p className="eyebrow text-gold">The trunk{centre.year ? ` · ${centre.year}` : ""}</p>
                <p className="display mt-1 text-3xl">{centre.title}</p>
                <p className="mt-2 text-sm text-white/80">{centre.story}</p>
              </li>
            );
          }
          const items = nodes.filter((n) => n.group === g);
          if (!items.length) return null;
          return (
            <li key={g} className="relative pb-2 pl-7 pt-6">
              <span aria-hidden className="absolute bottom-0 left-[9px] top-0 w-px" style={{ background: GROUPS[g].color, opacity: 0.6 }} />
              <p className="eyebrow" style={{ color: GROUPS[g].color }}>{GROUPS[g].title}</p>
              <ul className="mt-3 space-y-3">
                {items.map((n) => (
                  <li key={n.id} className="relative">
                    <span aria-hidden className="absolute -left-[24px] top-2 h-3 w-3 rounded-full border-2" style={{ borderColor: GROUPS[g].color, background: n.invite ? "transparent" : GROUPS[g].color }} />
                    <div className="rounded-sm border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-wrap items-center gap-2"><RelChip rel={n.relationship} />{n.year && <span className="text-xs text-white/60">{n.year}</span>}</div>
                      <p className="mt-1 font-semibold text-white">{n.label}</p>
                      <p className="text-xs text-white/60">{n.kind}</p>
                      {n.story && <p className="mt-2 text-sm text-white/75">{n.story}</p>}
                      {n.href && <Link href={n.href} className="mt-2 inline-block text-sm font-semibold text-gold">{n.invite ? "Start the conversation →" : "Read more →"}</Link>}
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
