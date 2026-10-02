"use client";
import { useActionState, useState, useTransition } from "react";
import { checkInWithPin, checkInGuest, confirmAsMember, type CheckInState } from "./actions";

function Success({ s }: { s: CheckInState }) {
  return (
    <div role="status" aria-live="assertive" className="rounded-lg bg-leaf p-6 text-white">
      <div className="flex items-center gap-4">
        <span aria-hidden className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white text-3xl text-leaf">✓</span>
        <div>
          <p className="display text-3xl leading-tight">{s.duplicate ? "Already checked in" : "You're checked in"}</p>
          <p className="mt-1 text-white/90">{s.name} · {s.at}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-white/85">{s.duplicate ? "Your attendance was already recorded — nothing more to do." : "Welcome. Enjoy the meeting."}</p>
    </div>
  );
}

export function CheckIn({ token, memberName, alreadyAt, allowGuests }: { token: string; memberName?: string; alreadyAt?: string; allowGuests: boolean }) {
  const [mode, setMode] = useState<"member" | "guest">("member");
  const [pinState, pinAction, pinPending] = useActionState<CheckInState, FormData>(checkInWithPin.bind(null, token), {});
  const [guestState, guestAction, guestPending] = useActionState<CheckInState, FormData>(checkInGuest.bind(null, token), {});
  const [oneTap, setOneTap] = useState<CheckInState>({});
  const [pending, start] = useTransition();

  for (const s of [oneTap, pinState, guestState]) if (s.ok) return <Success s={s} />;
  if (alreadyAt && memberName) return <Success s={{ ok: true, duplicate: true, name: memberName, at: alreadyAt }} />;

  if (memberName) {
    return (
      <div className="space-y-4">
        <button type="button" disabled={pending} onClick={() => start(async () => setOneTap(await confirmAsMember(token)))}
          className="flex min-h-[72px] w-full items-center justify-center rounded-lg bg-royal px-6 text-xl font-semibold text-white shadow-lg active:scale-[.99] disabled:opacity-60">
          {pending ? "Checking in…" : `I'm here — ${memberName.split(" ")[0]}`}
        </button>
        {oneTap.error && <p role="alert" className="font-semibold text-soil">{oneTap.error}</p>}
        <p className="text-center text-sm text-muted">Not {memberName}? <a href="/member/logout" className="underline">Switch member</a></p>
      </div>
    );
  }

  return (
    <div>
      {allowGuests && (
        <div role="tablist" aria-label="Who is checking in" className="mb-5 grid grid-cols-2 rounded-full bg-paper-2 p-1 text-sm font-semibold">
          {(["member", "guest"] as const).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} type="button" onClick={() => setMode(m)} className={`min-h-[44px] rounded-full ${mode === m ? "bg-white text-royal shadow" : "text-ink-2"}`}>{m === "member" ? "I'm a member" : "I'm a guest"}</button>
          ))}
        </div>
      )}
      {mode === "member" ? (
        <form action={pinAction} className="space-y-4">
          <label className="block"><span className="label">Member number</span>
            <input name="memberNumber" required autoComplete="username" autoCapitalize="characters" inputMode="text" className="field !min-h-[52px] text-lg" placeholder="e.g. RCG-014" />
          </label>
          <label className="block"><span className="label">PIN</span>
            <input name="pin" required type="password" inputMode="numeric" pattern="\d{4,8}" autoComplete="current-password" className="field !min-h-[52px] text-lg tracking-[0.4em]" placeholder="••••" />
          </label>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" name="remember" defaultChecked className="h-5 w-5 accent-royal" /> Remember this phone (one tap next time)</label>
          {pinState.error && <p role="alert" className="font-semibold text-soil">{pinState.error}</p>}
          <button disabled={pinPending} className="flex min-h-[60px] w-full items-center justify-center rounded-lg bg-royal text-lg font-semibold text-white disabled:opacity-60">{pinPending ? "Checking…" : "Check in"}</button>
          <p className="text-center text-xs text-muted">Forgot your PIN? An officer can record you manually.</p>
        </form>
      ) : (
        <form action={guestAction} className="space-y-4">
          <label className="block"><span className="label">Your name</span><input name="guestName" required autoComplete="name" className="field !min-h-[52px] text-lg" /></label>
          <label className="block"><span className="label">Phone (optional)</span><input name="guestPhone" type="tel" autoComplete="tel" className="field !min-h-[52px]" /></label>
          <label className="block"><span className="label">Your Rotary club, if any</span><input name="guestClub" className="field !min-h-[52px]" /></label>
          {guestState.error && <p role="alert" className="font-semibold text-soil">{guestState.error}</p>}
          <button disabled={guestPending} className="flex min-h-[60px] w-full items-center justify-center rounded-lg bg-gold text-lg font-semibold text-ink disabled:opacity-60">{guestPending ? "Checking…" : "Sign the visitors' book"}</button>
        </form>
      )}
    </div>
  );
}
