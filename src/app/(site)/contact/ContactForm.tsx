"use client";
import { useActionState } from "react";
import { sendContact, type ContactState } from "./actions";

const INTERESTS = [["visit", "Attend a fellowship"], ["join", "Membership"], ["support", "Support a project"], ["partner", "Sponsor or partner with the club"], ["volunteer", "Volunteer"], ["new-club", "Start an Interact / Rotaract club"], ["correction", "Correct something on this site"], ["other", "Something else"]];

export function ContactForm({ interest, tone = "light" }: { interest?: string; tone?: "light" | "dark" }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContact, {});
  const dark = tone === "dark";
  const field = dark ? "field-line" : "field";
  if (state.ok) return <div className={`p-6 ${dark ? "border border-white/20" : "border-l-4 border-royal bg-paper-2"}`} role="status"><p className="display text-2xl">Thank you.</p><p className={`mt-2 font-sans ${dark ? "text-white/70" : "text-muted"}`}>A club officer will get back to you. You are also welcome at any Sunday fellowship.</p></div>;
  const f = state.fields ?? {};
  const lab = (t: string) => <span className={dark ? "sr-only" : "label"}>{t}</span>;
  return (
    <form action={action} className={`grid gap-4 ${dark ? "" : "sm:grid-cols-2"}`} noValidate>
      <label>{lab("Your name")}<input name="name" required autoComplete="name" defaultValue={f.name} placeholder={dark ? "Name" : undefined} className={field} /></label>
      <label>{lab("Email")}<input name="email" type="email" required autoComplete="email" defaultValue={f.email} placeholder={dark ? "Email" : undefined} className={field} /></label>
      <label>{lab("Phone (optional)")}<input name="phone" type="tel" autoComplete="tel" defaultValue={f.phone} placeholder={dark ? "Phone (optional)" : undefined} className={field} /></label>
      <label>{lab("I'm interested in")}
        <select name="interest" defaultValue={f.interest ?? interest ?? ""} className={`${field} ${dark ? "[&>option]:text-ink" : ""}`}><option value="">{dark ? "I'm interested in…" : "Choose…"}</option>{INTERESTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      </label>
      <label className="sm:col-span-2">{lab("Message")}<textarea name="message" required rows={dark ? 4 : 5} defaultValue={f.message} placeholder={dark ? "Message" : undefined} className={field} /></label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {state.error && <p role="alert" className={`text-sm font-semibold sm:col-span-2 ${dark ? "text-gold" : "text-soil"}`}>{state.error}</p>}
      <div className="sm:col-span-2"><button className={`btn w-full ${dark ? "bg-royal text-white hover:bg-royal-deep" : "btn-dark sm:w-auto"}`} disabled={pending}>{pending ? "Sending…" : "Send message"}</button></div>
    </form>
  );
}
