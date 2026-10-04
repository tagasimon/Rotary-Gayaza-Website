"use client";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import clubs from "@/data/clubs.json";
import { signIn, type AttendState } from "./actions";

type Club = { name: string; district: string; type: string };
const ALL = clubs as Club[];
const KEY = "rcg-attend-v1";

function Choice({ name, value, checked, onChange, title, hint }: { name: string; value: string; checked: boolean; onChange: (v: string) => void; title: string; hint?: string }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3.5 transition-colors ${checked ? "border-royal bg-white ring-2 ring-royal/15" : "border-royal/15 bg-white/70 hover:border-royal/40"}`}>
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} className="mt-1 h-4 w-4 accent-royal" />
      <span><span className="block font-sans text-[0.95rem] font-semibold">{title}</span>{hint && <span className="block font-sans text-xs text-muted">{hint}</span>}</span>
    </label>
  );
}

const OTHER = "__other__";

/**
 * Club dropdown for guests. Opens a searchable list of Rotary or Rotaract clubs (Districts 9213 and 9214),
 * filtered by the Rotarian/Rotaractor answer, with a "my club isn't listed" option that reveals a text box.
 */
function ClubSelect({ affiliation, value, onChange }: { affiliation: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const listed = useMemo(() => new Set(ALL.map((c) => c.name)), []);
  const [other, setOther] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const type = affiliation === "ROTARACTOR" ? "ROTARACT" : affiliation === "ROTARIAN" ? "ROTARY" : null;

  useEffect(() => { if (value && !listed.has(value)) setOther(true); }, [value, listed]);
  const results = useMemo(() => {
    const terms = q.toLowerCase().replace(/rot(ary|aract) club of/g, "").split(/\s+/).filter(Boolean);
    return ALL.filter((c) => (!type || c.type === type) && c.name !== "Rotary Club of Gayaza" && terms.every((t) => c.name.toLowerCase().includes(t)));
  }, [q, type]);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  useEffect(() => { if (open) setTimeout(() => search.current?.focus(), 0); }, [open]);

  const pick = (name: string) => {
    if (name === OTHER) { setOther(true); onChange(""); } else { setOther(false); onChange(name); }
    setOpen(false); setQ("");
  };
  const options = [...results.slice(0, 200).map((c) => c.name), OTHER];
  const groups = (["9213", "9214"] as const).map((d) => ({ d, items: results.slice(0, 200).filter((c) => c.district === d) })).filter((g) => g.items.length);

  return (
    <div ref={wrap} className="relative">
      <input type="hidden" name="club" value={value} />
      <button type="button" id="club" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        className={`field flex !min-h-[52px] items-center justify-between gap-3 text-left text-base ${value || other ? "" : "text-muted"}`}>
        <span className="truncate">{other ? "My club isn't listed" : value || (type === "ROTARACT" ? "Choose your Rotaract club" : type === "ROTARY" ? "Choose your Rotary club" : "Choose your club")}</span>
        <span aria-hidden className={`text-royal transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-royal/20 bg-white shadow-[0_20px_40px_-20px_rgba(15,52,116,.5)]">
          <div className="border-b border-royal/10 p-2">
            <input ref={search} value={q} placeholder="Search clubs…" autoComplete="off" aria-label="Search clubs" aria-controls="club-list"
              onChange={(e) => { setQ(e.target.value); setActive(0); }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, options.length - 1)); }
                if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
                if (e.key === "Enter") { e.preventDefault(); pick(options[active]); }
                if (e.key === "Escape") setOpen(false);
              }}
              className="field !min-h-[44px] text-base" />
          </div>
          <ul id="club-list" role="listbox" aria-label="Clubs" className="max-h-72 overflow-y-auto py-1">
            {groups.map((g) => (
              <li key={g.d} role="presentation">
                <p className="sticky top-0 bg-mist px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-royal">District {g.d}</p>
                <ul role="presentation">
                  {g.items.map((c) => {
                    const i = options.indexOf(c.name);
                    return (
                      <li key={c.name} role="option" aria-selected={value === c.name}>
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(c.name)} onMouseEnter={() => setActive(i)}
                          className={`block w-full px-3 py-2.5 text-left text-sm ${i === active ? "bg-mist" : ""} ${value === c.name ? "font-bold text-royal" : ""}`}>{c.name}</button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
            {results.length === 0 && <li className="px-3 py-2 text-sm text-muted">No club matches &ldquo;{q}&rdquo;.</li>}
            <li role="option" aria-selected={other}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(OTHER)} onMouseEnter={() => setActive(options.length - 1)}
                className={`block w-full border-t border-royal/10 px-3 py-2.5 text-left text-sm font-semibold text-azure ${active === options.length - 1 ? "bg-mist" : ""}`}>My club isn&rsquo;t listed →</button>
            </li>
          </ul>
        </div>
      )}
      {other && (
        <input value={value} onChange={(e) => onChange(e.target.value)} autoFocus aria-label="Your club's full name"
          placeholder={type === "ROTARACT" ? "e.g. Rotaract Club of …" : "e.g. Rotary Club of …"} className="field mt-2 !min-h-[52px] text-base" />
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
      <div role="status" aria-live="assertive" className="band-royal rounded-2xl p-7 text-white">
        <span aria-hidden className="grid h-12 w-12 place-items-center rounded-full bg-white text-2xl text-royal">✓</span>
        <p className="display mt-5 text-[1.8rem] leading-tight">{state.duplicate ? "You're already signed in." : `Welcome, ${state.name}.`}</p>
        <p className="mt-2 font-sans text-white/75">{state.meeting} · {state.when}</p>
        <p className="mt-4 font-sans text-sm text-white/60">{state.duplicate ? "We've updated your details." : "Thank you for joining us. Enjoy the meeting."}{state.emailed && !state.duplicate ? (status === "guest" && affiliation !== "PROSPECT" ? " We've emailed you a thank-you note with your make-up card." : " We've emailed you a thank-you note.") : ""}</p>
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
          <Choice name="status" value="guest" checked={status === "guest"} onChange={setStatus} title="No, I am visiting" hint="To learn more about Rotary International" />
        </div>
      </fieldset>
      {status === "guest" && (
      <fieldset>
        <legend className="label">Which best describes you?</legend>
        <div className="grid gap-2">
          <Choice name="affiliation" value="ROTARIAN" checked={affiliation === "ROTARIAN"} onChange={setAffiliation} title="Visiting Rotarian" hint="A member of another Rotary club" />
          <Choice name="affiliation" value="ROTARACTOR" checked={affiliation === "ROTARACTOR"} onChange={setAffiliation} title="Visiting Rotaractor" hint="A member of a Rotaract club" />
          <Choice name="affiliation" value="PROSPECT" checked={affiliation === "PROSPECT"} onChange={setAffiliation} title="Prospect (Guest)" hint="Not yet in Rotary or Rotaract, finding out more" />
        </div>
      </fieldset>
      )}
      {status === "guest" && (affiliation === "ROTARIAN" || affiliation === "ROTARACTOR") && (
        <div className="rounded-lg border-l-4 border-gold bg-white p-4">
          <label className="label" htmlFor="club">Which club are you visiting from? <span className="text-cranberry">*</span></label>
          <ClubSelect affiliation={affiliation} value={club} onChange={setClub} />
          <p className="mt-2 text-xs text-muted">This helps the club see which clubs visit us.</p>
        </div>
      )}
      <div className="space-y-4">
        <label className="block"><span className="label">Full name</span><input name="name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="field !min-h-[52px] text-base" /></label>
        <label className="block"><span className="label">Email address</span><input name="email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field !min-h-[52px] text-base" /></label>
        <label className="block"><span className="label">Phone number</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="07…" value={phone} onChange={(e) => setPhone(e.target.value)} className="field !min-h-[52px] text-base" /></label>
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {state.error && <p role="alert" className="border-l-4 border-gold bg-white px-4 py-3 font-sans text-sm font-semibold text-ink">{state.error}</p>}
      <button disabled={pending} className="btn btn-royal w-full !py-5 text-base">{pending ? "Signing in…" : "Sign in"}</button>
      <p className="text-center font-sans text-xs text-muted">This phone will remember your details for next Sunday.</p>
    </form>
  );
}
