"use client";
import { useActionState } from "react";
import { setMemberPin } from "@/app/admin/(panel)/content/[resource]/actions";

export function PinPanel({ memberId, hasPin, pinSetAt }: { memberId: string; hasPin: boolean; pinSetAt: string | null }) {
  const [s, action, pending] = useActionState(setMemberPin.bind(null, memberId), {});
  return (
    <div className="card p-4">
      <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-soil">Attendance PIN</h2>
      <p className="mt-1 text-xs text-muted">{hasPin ? `PIN set ${pinSetAt}` : "No PIN yet — this member can't check in by QR."}</p>
      {s.pin ? (
        <div className="mt-3 rounded bg-royal p-3 text-white" role="status"><p className="text-xs uppercase tracking-wide text-gold">New PIN — shown once</p><p className="display text-3xl tracking-[0.3em]">{s.pin}</p><p className="mt-1 text-xs text-white/70">Give it to the member privately. They can change it in the portal.</p></div>
      ) : (
        <form action={action} className="mt-3 space-y-2">
          <input name="pin" inputMode="numeric" placeholder="Leave blank to generate a 6-digit PIN" className="field" />
          {s.error && <p className="text-xs font-semibold text-soil">{s.error}</p>}
          <button className="btn btn-line !min-h-0 w-full !py-2" disabled={pending}>{hasPin ? "Reset PIN" : "Set PIN"}</button>
        </form>
      )}
    </div>
  );
}
