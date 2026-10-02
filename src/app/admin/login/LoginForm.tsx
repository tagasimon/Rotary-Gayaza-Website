"use client";
import { useActionState } from "react";
import { adminLogin } from "./actions";
export function LoginForm() {
  const [s, action, pending] = useActionState(adminLogin, {});
  return (
    <form action={action} className="space-y-4">
      <label className="block"><span className="label">Email</span><input name="email" type="email" required autoComplete="username" className="field" /></label>
      <label className="block"><span className="label">Password</span><input name="password" type="password" required autoComplete="current-password" className="field" /></label>
      {s.error && <p role="alert" className="text-sm font-semibold text-soil">{s.error}</p>}
      <button disabled={pending} className="btn btn-royal w-full">{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
