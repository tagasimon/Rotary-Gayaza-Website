"use client";
import { useActionState } from "react";
import { memberLogin, type FormState } from "../actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(memberLogin, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? "/member"} />
      <label className="block"><span className="label">Member number</span><input name="memberNumber" required autoComplete="username" autoCapitalize="characters" className="field !min-h-[52px] text-lg" /></label>
      <label className="block"><span className="label">PIN</span><input name="pin" type="password" required inputMode="numeric" autoComplete="current-password" className="field !min-h-[52px] text-lg tracking-[0.4em]" /></label>
      {state.error && <p role="alert" className="font-semibold text-soil">{state.error}</p>}
      <button disabled={pending} className="flex min-h-[56px] w-full items-center justify-center rounded-lg bg-royal text-lg font-semibold text-white disabled:opacity-60">{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
