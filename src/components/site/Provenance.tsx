import type { Verification } from "@prisma/client";
import { hostOf } from "@/lib/utils";

/** Small, honest source line. Public pages show where a fact comes from. */
export function Provenance({ label, url, verification, className = "" }: { label?: string | null; url?: string | null; verification?: Verification | null; className?: string }) {
  if (!label && !url) return null;
  const pending = verification === "CLUB_RECORD" || verification === "NEEDS_CONFIRMATION";
  return (
    <p className={`text-xs text-muted ${className}`}>
      <span className="font-semibold uppercase tracking-wider">Source</span>{" "}
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="underline decoration-line hover:text-royal">
          {label || hostOf(url)} ↗
        </a>
      ) : (
        <span>{pending ? "Club records" : label}</span>
      )}
    </p>
  );
}
