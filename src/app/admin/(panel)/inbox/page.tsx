import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PageTitle, Badge, Empty } from "@/components/admin/ui";
import { ItemControls, EventControls, BulkEvents } from "@/components/admin/InboxControls";
import { formatDate, formatDateTime, formatTime } from "@/lib/time";
import { hostOf } from "@/lib/utils";

export const metadata = { title: "Discovered online" };
const SCOPE: Record<string, string> = { CLUB: "Our events", DISTRICT: "District events", COMMUNITY: "Rotary community" };

export default async function Inbox({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin("inbox");
  const tab = (await searchParams).tab ?? "events";
  const [events, items, reviewed] = await Promise.all([
    db.event.findMany({ where: { status: "PENDING_REVIEW" }, orderBy: [{ scope: "asc" }, { startsAt: "asc" }], take: 200 }),
    db.discoveredItem.findMany({ where: { status: "NEW" }, orderBy: { importedAt: "desc" }, take: 200 }),
    db.discoveredItem.findMany({ where: { status: { not: "NEW" } }, orderBy: { reviewedAt: "desc" }, take: 30 }),
  ]);
  const Tab = ({ k, label, n }: { k: string; label: string; n?: number }) => <Link href={`?tab=${k}`} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === k ? "bg-ink text-white" : "bg-white text-ink-2 ring-1 ring-ink/10"}`}>{label}{n ? ` · ${n}` : ""}</Link>;
  return (
    <>
      <PageTitle title="Discovered online" subtitle="Found automatically on District 9213, Rotary-O and the club's sources. Nothing is published until you approve it." actions={<Link href="/admin/sources" className="btn btn-line !min-h-0 !py-2">Sources & import from URL</Link>} />
      <div className="mb-5 flex flex-wrap gap-2"><Tab k="events" label="Events awaiting review" n={events.length} /><Tab k="items" label="Stories, albums & mentions" n={items.length} /><Tab k="history" label="Reviewed" /></div>

      {tab === "events" && (events.length === 0 ? <Empty>No imported events waiting for review.</Empty> : (
        <>
          {(["CLUB", "DISTRICT", "COMMUNITY"] as const).map((sc) => {
            const list = events.filter((e) => e.scope === sc);
            if (!list.length) return null;
            return (
              <section key={sc} className="mb-6">
                <div className="mb-2 flex items-center justify-between"><h2 className="text-xs font-bold uppercase tracking-[0.18em] text-soil">{SCOPE[sc]} · {list.length}</h2><BulkEvents ids={list.map((e) => e.id)} /></div>
                <ul className="card divide-y divide-ink/5">
                  {list.map((e) => (
                    <li key={e.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
                      <div>
                        <p className="font-semibold">{e.title} {e.type === "DG_VISIT" && <Badge value="DG_VISIT" />}</p>
                        <p className="text-sm text-muted">{formatDate(e.startsAt, "day")}{e.timeTbc || e.allDay ? "" : ` · ${formatTime(e.startsAt)}`}{e.venue ? ` · ${e.venue}` : ""}{e.organiser ? ` · ${e.organiser}` : ""}</p>
                        <p className="mt-1 text-xs text-muted">Source: {e.sourceUrl ? <a className="underline" href={e.sourceUrl} target="_blank" rel="noreferrer">{e.sourceLabel ?? hostOf(e.sourceUrl)} ↗</a> : e.sourceLabel} · imported {formatDateTime(e.importedAt)} · last checked {formatDateTime(e.lastCheckedAt)}{e.externalId ? ` · ID ${e.externalId.slice(0, 18)}` : ""}</p>
                      </div>
                      <EventControls id={e.id} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </>
      ))}

      {tab === "items" && (items.length === 0 ? <Empty>Nothing new. The next automatic check will look again.</Empty> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-muted"><tr><th className="px-4 py-2">Source</th><th className="px-2 py-2">Title</th><th className="px-2 py-2">Date</th><th className="px-2 py-2">Type</th><th className="px-2 py-2">Imported</th><th className="px-4 py-2">Suggested destination · action</th></tr></thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b border-ink/5 align-top last:border-0">
                  <td className="px-4 py-3 text-xs">{it.sourceLabel}</td>
                  <td className="max-w-md px-2 py-3"><p className="font-semibold">{it.url ? <a className="text-royal hover:underline" href={it.url} target="_blank" rel="noreferrer">{it.title} ↗</a> : it.title}</p>{it.summary && <p className="mt-1 text-xs text-muted">{it.summary}</p>}</td>
                  <td className="whitespace-nowrap px-2 py-3 text-xs">{it.itemDate ? formatDate(it.itemDate, "short") : "—"}</td>
                  <td className="px-2 py-3"><Badge value={it.type} /></td>
                  <td className="whitespace-nowrap px-2 py-3 text-xs text-muted">{formatDateTime(it.importedAt)}</td>
                  <td className="px-4 py-3"><ItemControls id={it.id} suggested={it.suggestedDestination} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {tab === "history" && (
        <ul className="card divide-y divide-ink/5 text-sm">
          {reviewed.map((it) => <li key={it.id} className="flex justify-between gap-3 p-3"><span>{it.title}</span><span className="flex items-center gap-2 text-xs text-muted"><Badge value={it.status} />{it.reviewedAt && formatDateTime(it.reviewedAt)}</span></li>)}
          {reviewed.length === 0 && <li className="p-6 text-center text-muted">Nothing reviewed yet.</li>}
        </ul>
      )}
    </>
  );
}
