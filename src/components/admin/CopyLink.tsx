"use client";
import { useState } from "react";
export function CopyLink({ text, label = "Copy link (for WhatsApp)" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return <button type="button" onClick={async () => { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 2000); }} className="btn btn-line !min-h-0 !py-3">{done ? "Copied ✓" : label}</button>;
}
