import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PageTitle, Badge } from "@/components/admin/ui";
import { RunButton, ImportForm } from "@/components/admin/SourceControls";
import { updateSource } from "./actions";
import { formatDateTime } from "@/lib/time";

export const metadata = { title: "Sources" };

export default async function Sources() {
  await requireAdmin("sources");
  const [sources, runs] = await Promise.all([db.eventSource.findMany({ orderBy: { createdAt: "asc" } }), db.ingestionRun.findMany({ orderBy: { startedAt: "desc" }, take: 10 })]);
  const interval = process.env.INGEST_INTERVAL_HOURS || "12";
  const auto = process.env.INGEST_ENABLED !== "false";
  return (
    <>
      <PageTitle title="Sources & import" subtitle={auto ? `Checked automatically every ${interval} hours. Structured feeds (iCal) are preferred over page reading; nothing is published without review.` : "Automatic checking is off (INGEST_ENABLED=false). Use Run now or the cron endpoint."} actions={<RunButton label="Check all sources now" />} />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-3">
          {sources.map((s) => (
            <div key={s.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{s.name} {!s.enabled && <Badge value="ARCHIVED" />}</p>
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-muted underline">{s.url}</a>
                  {s.notes && <p className="mt-1 text-xs text-muted">{s.notes}</p>}
                  <p className="mt-2 text-xs">{s.lastRunAt ? <>Last run {formatDateTime(s.lastRunAt)} · <Badge value={s.lastStatus === "ok" ? "APPROVED" : "REJECTED"} /> · found {s.lastFound}, new {s.lastCreated}</> : "Never run"}{s.lastError && <span className="block text-soil">{s.lastError}</span>}</p>
                </div>
                {s.kind !== "URL_IMPORT" && <RunButton k={s.key} />}
              </div>
              {s.kind !== "URL_IMPORT" && (
                <form action={updateSource.bind(null, s.id)} className="mt-3 flex flex-wrap items-end gap-3 border-t border-ink/5 pt-3">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={s.enabled} className="h-4 w-4 accent-royal" /> Enabled</label>
                  <label className="min-w-[220px] flex-1"><span className="label">Keyword filter (comma-separated, blank = all)</span><input name="keywords" defaultValue={s.keywords.join(", ")} className="field" /></label>
                  <button className="btn btn-line !min-h-0 !py-2 text-xs">Save</button>
                </form>
              )}
            </div>
          ))}
        </div>
        <aside className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-soil">Import from source</h2>
            <p className="mb-3 text-xs text-muted">For anything that can&rsquo;t be imported reliably — posts on X, newspaper articles, PDFs, one-off event pages. The link goes to the review inbox.</p>
            <ImportForm />
          </section>
          <section className="card p-5 text-sm">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-soil">Recent runs</h2>
            <ul className="space-y-1 text-xs">{runs.map((r) => <li key={r.id} className="flex justify-between"><span>{formatDateTime(r.startedAt)} · {r.trigger}</span><Badge value={r.finishedAt ? (r.ok ? "APPROVED" : "REJECTED") : "PENDING_REVIEW"} /></li>)}</ul>
          </section>
        </aside>
      </div>
    </>
  );
}
