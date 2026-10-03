import type { ClubTally } from "@/lib/attendance-report";
import { formatDate } from "@/lib/time";

/** "Guests by club": which Rotary and Rotaract clubs visit, with simple bars (no chart library). */
export function GuestClubs({ rows, title = "Guests by club", note, showLast = true }: { rows: ClubTally[]; title?: string; note?: string; showLast?: boolean }) {
  const max = Math.max(1, ...rows.map((r) => r.visits));
  const rotary = rows.filter((r) => r.type === "Rotary").reduce((a, r) => a + r.visits, 0);
  const rotaract = rows.filter((r) => r.type === "Rotaract").reduce((a, r) => a + r.visits, 0);
  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-royal/10 px-4 py-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-royal">{title}</h2>
        <p className="text-xs text-muted">{rows.length} club{rows.length === 1 ? "" : "s"} · {rotary} Rotary · {rotaract} Rotaract visits{note ? ` · ${note}` : ""}</p>
      </div>
      {rows.length === 0 ? <p className="px-4 py-6 text-sm text-muted">No guests from other clubs yet.</p> : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-muted">
            <tr><th className="px-4 py-2">Club</th><th className="hidden px-2 py-2 sm:table-cell">Type</th><th className="w-[35%] px-2 py-2">Visits</th><th className="px-2 py-2 text-right">People</th>{showLast && <th className="hidden px-4 py-2 text-right md:table-cell">Last visit</th>}</tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.club} className="border-t border-royal/5">
                <td className="px-4 py-2 font-semibold">{r.club}{r.district && <span className="ml-1 text-xs font-normal text-muted">D{r.district}</span>}</td>
                <td className="hidden px-2 py-2 text-xs sm:table-cell"><span className={`rounded-full px-2 py-0.5 font-bold ${r.type === "Rotaract" ? "bg-cranberry/10 text-cranberry" : r.type === "Rotary" ? "bg-royal/10 text-royal" : "bg-paper-2 text-muted"}`}>{r.type}</span></td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-2">
                    <span className="block h-2.5 rounded-full bg-gold" style={{ width: `${Math.max(6, (r.visits / max) * 100)}%` }} aria-hidden />
                    <span className="tabular-nums font-semibold">{r.visits}</span>
                  </div>
                </td>
                <td className="px-2 py-2 text-right tabular-nums">{r.people}</td>
                {showLast && <td className="hidden whitespace-nowrap px-4 py-2 text-right text-xs text-muted md:table-cell">{r.lastSeen ? formatDate(r.lastSeen, "short") : "—"}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
