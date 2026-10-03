"use client";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import clubs from "@/data/clubs.json";
import { signIn, type AttendState } from "./actions";

type Club = { name: string; district: string; type: string };
const ALL = clubs as Club[];
const KEY = "rcg-attend-v1";

function Choice({ name, value, checked, onChange, title, hint }: { name: string; value: string; checked: boolean; onChange: (v: string) => void; title: string; hint?: string }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 border px-4 py-3.5 transition-colors ${checked ? "border-ink bg-white" : "border-ink/15 bg-white/60 hover:border-ink/40"}`}>
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} className="mt-1 h-4 w-4 accent-royal" />
      <span><span className="block font-sans text-[0.95rem] font-semibold">{title}</span>{hint && <span className="block font-sans text-xs text-muted">{hint}</span>}</span>
    </label>
  );
}

function ClubPicker({ affiliation, value, onChange }: { affiliation: string; value: string; onChange: (v: string) => void }) {
  const [q, setQ] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => setQ(value), [value]);
  const results = useMemo(() => {
    const type = affiliation === "ROTARACTOR" ? "ROTARACT" : affiliation === "ROTARIAN" ? "ROTARY" : null;
    const terms = q.toLowerCase().replace(/rot(ary|aract) club of/g, "").split(/\s+/).filter(Boolean);
    return ALL.filter((c) => (!type || c.type === type) && c.name !== "Rotary Club of Gayaza" && terms.every((t) => c.name.toLowerCase().includes(t))).slice(0, 8);
  }, [q, affiliation]);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const pick = (name: string) => { onChange(name); setQ(name); setOpen(false); };
  return (
    <div ref={wrap} className="relative">
      <input name="club" value={q} autoComplete="off" role="combobox" aria-expanded={open} aria-controls="club-list" aria-autocomplete="list"
        placeholder={affiliation === "ROTARACTOR" ? "Start typing, e.g. Bugema" : "Start typing, e.g. Kasangati"}
        onChange={(e) => { setQ(e.target.value); onChange(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          if (e.key === "Enter" && open && results[active]) { e.preventDefault(); pick(results[active].name); }
          if (e.key === "Escape") setOpen(false);
        }}
        className="field !min-h-[52px] text-base" />
      {open && q.length > 0 && (
        <ul id="club-list" role="listbox" className="absolute z-10 mt-1 max-h-72 w-full overflow-y-auto border border-ink/15 bg-white shadow-lg">
          {results.map((c, i) => (
            <li key={c.name} role="option" aria-selected={i === active}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(c.name)} className={`block w-full px-3 py-2.5 text-left font-sans text-sm ${i === active ? "bg-paper-2" : ""}`}>
                {c.name} <span className="text-xs text-muted">· D{c.district}</span>
              </button>
            </li>
          ))}
          <li className="px-3 py-2 font-sans text-xs text-muted">{results.length ? "Not listed? Just type your club's full name." : "No match — your typed club name will be used."}</li>
        </ul>
      )}
    </div>
  );
}

export function AttendForm() {
  const [state, action, pending] = useActionState<AttendState, FormData>(signIn, {});
  const [status, setStatus] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [club, setClub] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "{}");
      if (s.status) setStatus(s.status);
      if (s.affiliation) setAffiliation(s.affiliation);
      if (s.club) setClub(s.club);
      if (s.name) setName(s.name);
      if (s.email) setEmail(s.email);
      if (s.phone) setPhone(s.phone);
    } catch { /* storage unavailable */ }
  }, []);

  if (state.ok) {
    return (
      <div role="status" aria-live="assertive" className="bg-royal p-7 text-white">
        <span aria-hidden className="grid h-12 w-12 place-items-center rounded-full bg-white text-2xl text-royal">✓</span>
        <p className="display mt-5 text-[1.8rem] leading-tight">{state.duplicate ? "You're already signed in." : `Welcome, ${state.name}.`}</p>
        <p className="mt-2 font-sans text-white/75">{state.meeting} · {state.when}</p>
        <p className="mt-4 font-sans text-sm text-white/60">{state.duplicate ? "We've updated your details." : "Thank you for joining us. Enjoy the fellowship."}</p>
      </div>
    );
  }

  return (
    <form ref={form} action={(fd) => {
      try { localStorage.setItem(KEY, JSON.stringify({ status, affiliation, club, name, email, phone })); } catch { /* ignore */ }
      return action(fd);
    }} className="space-y-6">
      <fieldset>
        <legend className="label">Are you a member of RC Gayaza?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <Choice name="status" value="member" checked={status === "member"} onChange={setStatus} title="Yes, I'm a member" hint="Rotary Club of Gayaza" />
          <Choice name="status" value="guest" checked={status === "guest"} onChange={setStatus} title="No, I'm a guest" hint="Visiting from another club" />
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">Are you a Rotarian or a Rotaractor?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <Choice name="affiliation" value="ROTARIAN" checked={affiliation === "ROTARIAN"} onChange={setAffiliation} title="Rotarian" />
          <Choice name="affiliation" value="ROTARACTOR" checked={affiliation === "ROTARACTOR"} onChange={setAffiliation} title="Rotaractor" />
        </div>
      </fieldset>
      {status === "guest" && (
        <div>
          <label className="label" htmlFor="club">Which club are you from?</label>
          <ClubPicker affiliation={affiliation} value={club} onChange={setClub} />
        </div>
      )}
      <div className="space-y-4">
        <label className="block"><span className="label">Full name</span><input name="name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="field !min-h-[52px] text-base" /></label>
        <label className="block"><span className="label">Email address</span><input name="email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field !min-h-[52px] text-base" /></label>
        <label className="block"><span className="label">Phone number</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="07…" value={phone} onChange={(e) => setPhone(e.target.value)} className="field !min-h-[52px] text-base" /></label>
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {state.error && <p role="alert" className="border-l-4 border-gold bg-white px-4 py-3 font-sans text-sm font-semibold text-ink">{state.error}</p>}
      <button disabled={pending} className="btn btn-dark w-full !py-5">{pending ? "Signing in…" : "Sign in"}</button>
      <p className="text-center font-sans text-xs text-muted">This phone will remember your details for next Sunday.</p>
    </form>
  );
}
