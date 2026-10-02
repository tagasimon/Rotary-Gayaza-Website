"use client";
import { useActionState, useState, useTransition } from "react";
import { runNow, importFromUrl, type ImportState } from "@/app/admin/(panel)/sources/actions";

export function RunButton({ k, label = "Run now" }: { k?: string; label?: string }) {
  const [p, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-2">
      <button disabled={p} onClick={() => start(async () => { const r = await runNow(k); setMsg("results" in r && r.results ? `Done: ${r.results.reduce((a, x) => a + x.created, 0)} new` : "Already running"); })} className="btn btn-line !min-h-0 !py-1.5 text-xs">{p ? "Checking…" : label}</button>
      {msg && <span className="text-xs text-leaf" role="status">{msg}</span>}
    </span>
  );
}

export function ImportForm() {
  const [s, act, p] = useActionState<ImportState, FormData>(importFromUrl, {});
  const [type, setType] = useState("STORY");
  return (
    <form action={act} className="grid gap-3 sm:grid-cols-2">
      <label className="sm:col-span-2"><span className="label">Link</span><input name="url" type="url" required placeholder="https://x.com/Rcgayaza/status/… or any article / event page" className="field" /></label>
      <label><span className="label">Import as</span><select name="type" value={type} onChange={(e) => setType(e.target.value)} className="field"><option value="STORY">Story</option><option value="EVENT">Event</option><option value="PHOTO_ALBUM">Photo album</option><option value="DG_VISIT">DG visit</option><option value="CLUB">Club (family)</option><option value="CLUB_MENTION">Mention of the club</option><option value="OTHER">Other</option></select></label>
      {type === "EVENT" && <label><span className="label">Show under</span><select name="scope" className="field"><option value="CLUB">Our events</option><option value="DISTRICT">District events</option><option value="COMMUNITY">Rotary community</option></select></label>}
      <label><span className="label">Date (if known)</span><input name="date" type="date" className="field" /></label>
      <label className="sm:col-span-2"><span className="label">Title (optional — read from the page when possible)</span><input name="title" className="field" /></label>
      <label className="sm:col-span-2"><span className="label">Summary (optional)</span><textarea name="summary" rows={2} className="field" /></label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button disabled={p} className="btn btn-royal !min-h-0 !py-2">{p ? "Importing…" : "Send to review inbox"}</button>
        {s.ok && <span className="text-sm font-semibold text-leaf" role="status">Added to the inbox ✓ {s.note}</span>}
        {s.error && <span className="text-sm font-semibold text-soil" role="alert">{s.error}</span>}
      </div>
    </form>
  );
}
