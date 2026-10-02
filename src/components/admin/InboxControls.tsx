"use client";
import { useState, useTransition } from "react";
import { approveItem, rejectItem, setEventStatus, bulkEvents } from "@/app/admin/(panel)/inbox/actions";

const DESTS = [["stories", "Story (draft)"], ["albums", "Photo album (draft)"], ["dg-visits", "DG visit (draft)"], ["family", "Rotary family club (draft)"], ["projects", "Project (draft)"], ["none", "Acknowledge only"]] as const;

export function ItemControls({ id, suggested }: { id: string; suggested?: string | null }) {
  const [dest, setDest] = useState(suggested && DESTS.some((d) => d[0] === suggested) ? suggested : "none");
  const [p, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select value={dest} onChange={(e) => setDest(e.target.value)} className="field !min-h-0 max-w-[200px] !py-1.5 text-xs" aria-label="Destination">{DESTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      <button disabled={p} onClick={() => start(() => approveItem(id, dest))} className="btn btn-royal !min-h-0 !px-3 !py-1.5 text-xs">{p ? "…" : "Approve"}</button>
      <button disabled={p} onClick={() => start(() => rejectItem(id))} className="btn btn-line !min-h-0 !px-3 !py-1.5 text-xs">Reject</button>
    </div>
  );
}

export function EventControls({ id }: { id: string }) {
  const [p, start] = useTransition();
  return (
    <div className="flex gap-2">
      <button disabled={p} onClick={() => start(() => setEventStatus(id, "APPROVED"))} className="btn btn-royal !min-h-0 !px-3 !py-1.5 text-xs">Approve</button>
      <a href={`/admin/content/events/${id}`} className="btn btn-line !min-h-0 !px-3 !py-1.5 text-xs">Edit</a>
      <button disabled={p} onClick={() => start(() => setEventStatus(id, "REJECTED"))} className="btn btn-line !min-h-0 !px-3 !py-1.5 text-xs">Reject</button>
    </div>
  );
}

export function BulkEvents({ ids }: { ids: string[] }) {
  const [p, start] = useTransition();
  if (!ids.length) return null;
  return (
    <div className="flex gap-2">
      <button disabled={p} onClick={() => start(() => bulkEvents(ids, "APPROVED"))} className="btn btn-line !min-h-0 !py-1.5 text-xs">Approve all {ids.length}</button>
      <button disabled={p} onClick={() => start(() => bulkEvents(ids, "REJECTED"))} className="btn btn-line !min-h-0 !py-1.5 text-xs">Reject all</button>
    </div>
  );
}
