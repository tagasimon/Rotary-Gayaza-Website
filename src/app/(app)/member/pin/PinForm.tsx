"use client";
import { useActionState } from "react";
import { changePin, type FormState } from "../actions";
export function PinForm() {
  const [s, action, pending] = useActionState<FormState, FormData>(changePin, {});
  if (s.ok) return <p role="status" className="font-semibold text-leaf">PIN updated. Use your new PIN next time.</p>;
  return (
    <form action={action} className="space-y-4">
      {[["current", "Current PIN"], ["next", "New PIN (4–8 digits)"], ["confirm", "Confirm new PIN"]].map(([n, l]) => (
        <label key={n} className="block"><span className="label">{l}</span><input name={n} type="password" inputMode="numeric" required className="field !min-h-[52px] tracking-[0.4em]" /></label>
      ))}
      {s.error && <p role="alert" className="font-semibold text-soil">{s.error}</p>}
      <button disabled={pending} className="btn btn-royal w-full">{pending ? "Saving…" : "Save new PIN"}</button>
    </form>
  );
}
