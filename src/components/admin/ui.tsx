import Link from "next/link";
import type { ReactNode } from "react";

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-ink/10 pb-4 pt-2">
      <div><h1 className="display text-3xl sm:text-4xl">{title}</h1>{subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}</div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="display mt-1 text-3xl tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

const TONES: Record<string, string> = {
  PUBLISHED: "bg-leaf/15 text-leaf", APPROVED: "bg-leaf/15 text-leaf", ACTIVE: "bg-leaf/15 text-leaf", VERIFIED: "bg-leaf/15 text-leaf", PRESENT: "bg-leaf/15 text-leaf",
  DRAFT: "bg-ink/10 text-ink-2", PENDING_REVIEW: "bg-gold/25 text-[#7a5200]", NEW: "bg-gold/25 text-[#7a5200]", CLUB_RECORD: "bg-gold/25 text-[#7a5200]", EXCUSED: "bg-gold/25 text-[#7a5200]",
  NEEDS_CONFIRMATION: "bg-soil/15 text-soil", REJECTED: "bg-soil/15 text-soil", ARCHIVED: "bg-ink/10 text-muted", INACTIVE: "bg-ink/10 text-muted", LEFT: "bg-ink/10 text-muted",
};
export function Badge({ value }: { value?: string | null }) {
  if (!value) return null;
  const label = value === "CLUB_RECORD" ? "Club record · confirm" : value.replace(/_/g, " ").toLowerCase();
  return <span className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide ${TONES[value] ?? "bg-ink/10 text-ink-2"}`}>{label}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="card p-10 text-center text-sm text-muted">{children}</div>;
}

export function Pager({ page, pages, base }: { page: number; pages: number; base: string }) {
  if (pages <= 1) return null;
  const sep = base.includes("?") ? "&" : "?";
  return (
    <nav className="mt-4 flex items-center gap-3 text-sm" aria-label="Pages">
      {page > 1 && <Link className="btn btn-line !min-h-0 !py-1.5" href={`${base}${sep}page=${page - 1}`}>← Prev</Link>}
      <span className="text-muted">Page {page} / {pages}</span>
      {page < pages && <Link className="btn btn-line !min-h-0 !py-1.5" href={`${base}${sep}page=${page + 1}`}>Next →</Link>}
    </nav>
  );
}
