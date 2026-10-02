"use client";
import { useActionState } from "react";
import type { S } from "@/app/admin/(panel)/meetings/actions";

type A = (s: S, f: FormData) => Promise<S>;
const Msg = ({ s }: { s: S }) => <>{s.error && <p role="alert" className="text-sm font-semibold text-soil">{s.error}</p>}{s.ok && <p role="status" className="text-sm font-semibold text-leaf">Saved ✓</p>}</>;

export function MeetingForm({ action, v, events }: { action: A; v: Record<string, string | boolean | number>; events: { id: string; title: string }[] }) {
  const [s, act, pending] = useActionState(action, {});
  return (
    <form action={act} className="grid gap-3 sm:grid-cols-2">
      <label className="sm:col-span-2"><span className="label">Title</span><input name="title" defaultValue={String(v.title ?? "")} required className="field" /></label>
      <label><span className="label">Starts</span><input name="date" type="datetime-local" defaultValue={String(v.date ?? "")} required className="field" /></label>
      <label><span className="label">Ends</span><input name="endsAt" type="datetime-local" defaultValue={String(v.endsAt ?? "")} className="field" /></label>
      <label><span className="label">Type</span><select name="type" defaultValue={String(v.type ?? "REGULAR")} className="field">{["REGULAR", "FELLOWSHIP", "SERVICE", "DG_VISIT", "BOARD", "SPECIAL"].map((t) => <option key={t} value={t}>{t.replace("_", " ").toLowerCase()}</option>)}</select></label>
      <label><span className="label">Venue</span><input name="venue" defaultValue={String(v.venue ?? "")} className="field" /></label>
      <label><span className="label">Uncounted guests</span><input name="guestCount" type="number" min={0} defaultValue={String(v.guestCount ?? 0)} className="field" /></label>
      <label><span className="label">Linked event</span><select name="eventId" defaultValue={String(v.eventId ?? "")} className="field"><option value="">—</option>{events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}</select></label>
      <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2"><input type="checkbox" name="countsTowardAttendance" defaultChecked={v.countsTowardAttendance !== false} className="h-5 w-5 accent-royal" /> Counts toward attendance statistics</label>
      <label className="sm:col-span-2"><span className="label">Notes</span><textarea name="notes" defaultValue={String(v.notes ?? "")} rows={2} className="field" /></label>
      <div className="flex items-center gap-3 sm:col-span-2"><button className="btn btn-royal !min-h-0 !py-2" disabled={pending}>Save meeting</button><Msg s={s} /></div>
    </form>
  );
}

export function OpenAttendanceForm({ action, opensAt, closesAt }: { action: A; opensAt: string; closesAt: string }) {
  const [s, act, pending] = useActionState(action, {});
  return (
    <form action={act} className="grid gap-3 sm:grid-cols-2">
      <label><span className="label">Opens</span><input name="opensAt" type="datetime-local" defaultValue={opensAt} className="field" /></label>
      <label><span className="label">Closes</span><input name="closesAt" type="datetime-local" defaultValue={closesAt} className="field" /></label>
      <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2"><input type="checkbox" name="allowGuests" defaultChecked className="h-5 w-5 accent-royal" /> Let guests sign the visitors&rsquo; book</label>
      <div className="flex items-center gap-3 sm:col-span-2"><button className="btn btn-gold !min-h-0 !py-2" disabled={pending}>Generate QR code</button><Msg s={s} /></div>
    </form>
  );
}

export function ManualRecordForm({ action, members }: { action: A; members: { id: string; label: string }[] }) {
  const [s, act, pending] = useActionState(action, {});
  return (
    <form action={act} className="grid gap-2 sm:grid-cols-[1fr_140px]">
      <select name="memberId" className="field" required defaultValue=""><option value="" disabled>Choose member…</option>{members.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select>
      <select name="status" className="field" defaultValue="PRESENT"><option value="PRESENT">Present</option><option value="EXCUSED">Excused</option><option value="MAKEUP">Make-up</option></select>
      <input name="note" placeholder="Reason (optional, e.g. phone battery dead)" className="field sm:col-span-2" />
      <div className="flex items-center gap-3"><button className="btn btn-line !min-h-0 !py-2" disabled={pending}>Record</button><Msg s={s} /></div>
    </form>
  );
}

export function GuestForm({ action }: { action: A }) {
  const [s, act, pending] = useActionState(action, {});
  return (
    <form action={act} className="grid gap-2 sm:grid-cols-2">
      <input name="guestName" placeholder="Guest name" className="field" />
      <input name="guestClub" placeholder="Club (optional)" className="field" />
      <div className="flex items-center gap-3"><button className="btn btn-line !min-h-0 !py-2" disabled={pending}>Add guest</button><Msg s={s} /></div>
    </form>
  );
}
