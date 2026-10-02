"use client";
import { useEffect, useState } from "react";
export function LiveCount({ meetingId }: { meetingId: string }) {
  const [n, setN] = useState<{ members: number; guests: number } | null>(null);
  useEffect(() => {
    let alive = true;
    const tick = async () => { try { const r = await fetch(`/api/admin/meetings/${meetingId}/live`, { cache: "no-store" }); if (r.ok && alive) setN(await r.json()); } catch {} };
    tick();
    const t = setInterval(tick, 5000);
    return () => { alive = false; clearInterval(t); };
  }, [meetingId]);
  if (!n) return null;
  return <p className="mt-10 text-3xl" aria-live="polite"><span className="display text-6xl text-gold">{n.members}</span> {n.members === 1 ? "member" : "members"} checked in{n.guests ? <span className="opacity-70"> · {n.guests} {n.guests === 1 ? "guest" : "guests"}</span> : null}</p>;
}
