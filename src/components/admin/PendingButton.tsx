"use client";
import { useFormStatus } from "react-dom";

export function PendingButton({ children, pendingText = "Sending…", className = "" }: { children: React.ReactNode; pendingText?: string; className?: string }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} className={className}>{pending ? pendingText : children}</button>;
}
