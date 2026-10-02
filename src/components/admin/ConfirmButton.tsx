"use client";
import { useState, useTransition } from "react";

/** Two-step confirm without browser dialogs (no window.confirm). */
export function ConfirmButton({ action, label, confirmText = "Click again to confirm", className = "" }: { action: () => Promise<unknown>; label: string; confirmText?: string; className?: string }) {
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} onBlur={() => setArmed(false)}
      onClick={() => (armed ? start(async () => { await action(); }) : setArmed(true))}
      className={`text-xs font-semibold ${armed ? "rounded bg-soil px-2 py-1 text-white" : "text-soil underline"} ${className}`}>
      {pending ? "Working…" : armed ? confirmText : label}
    </button>
  );
}
