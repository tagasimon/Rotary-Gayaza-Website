"use client";
import { useActionState } from "react";
export function AddAttendee({ action }: { action: (s: { error?: string; ok?: boolean }, f: FormData) => Promise<{ error?: string; ok?: boolean }> }) {
  const [s, act, p] = useActionState(action, {});
  return (
    <form action={act} className="grid gap-2">
      <input name="name" placeholder="Full name" className="field" required />
      <div className="grid grid-cols-2 gap-2">
        <select name="isGuest" className="field"><option value="member">Member</option><option value="guest">Guest</option></select>
        <select name="affiliation" className="field"><option value="ROTARIAN">Rotarian</option><option value="ROTARACTOR">Rotaractor</option></select>
      </div>
      <input name="club" placeholder="Club (guests)" className="field" />
      <div className="grid grid-cols-2 gap-2"><input name="email" placeholder="Email" className="field" /><input name="phone" placeholder="Phone" className="field" /></div>
      <div className="flex items-center gap-3"><button className="btn btn-royal !min-h-0 !py-2.5" disabled={p}>Add</button>{s.ok && <span className="text-sm text-leaf">Added ✓</span>}{s.error && <span className="text-sm text-soil">{s.error}</span>}</div>
    </form>
  );
}
