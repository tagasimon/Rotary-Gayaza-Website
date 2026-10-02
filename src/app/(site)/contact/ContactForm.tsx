"use client";
import { useActionState } from "react";
import { sendContact, type ContactState } from "./actions";

const INTERESTS = [["visit", "Attend a fellowship"], ["join", "Membership"], ["support", "Support a project"], ["partner", "Partner with the club"], ["volunteer", "Volunteer"], ["new-club", "Start an Interact / Rotaract club"], ["correction", "Correct something on this site"], ["other", "Something else"]];

export function ContactForm({ interest }: { interest?: string }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContact, {});
  if (state.ok) return <div className="border-l-4 border-leaf bg-white p-6" role="status"><p className="display text-3xl">Thank you.</p><p className="mt-2 text-ink-2">A club officer will get back to you. You are also welcome to come to any Sunday meeting.</p></div>;
  const f = state.fields ?? {};
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2" noValidate>
      <label className="sm:col-span-1"><span className="label">Your name</span><input name="name" required autoComplete="name" defaultValue={f.name} className="field" /></label>
      <label><span className="label">Email</span><input name="email" type="email" required autoComplete="email" defaultValue={f.email} className="field" /></label>
      <label><span className="label">Phone (optional)</span><input name="phone" type="tel" autoComplete="tel" defaultValue={f.phone} className="field" /></label>
      <label><span className="label">I'm interested in</span>
        <select name="interest" defaultValue={f.interest ?? interest ?? ""} className="field"><option value="">Choose…</option>{INTERESTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      </label>
      <label className="sm:col-span-2"><span className="label">Message</span><textarea name="message" required rows={5} defaultValue={f.message} className="field" /></label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {state.error && <p role="alert" className="text-sm font-semibold text-soil sm:col-span-2">{state.error}</p>}
      <div className="sm:col-span-2"><button className="btn btn-royal" disabled={pending}>{pending ? "Sending…" : "Send message"}</button></div>
    </form>
  );
}
