"use client";
import { useActionState, useState, useTransition } from "react";
import { createUser, resetPassword, changeOwnPassword, type U } from "@/app/admin/(panel)/users/actions";

export function NewUserForm() {
  const [s, act, p] = useActionState<U, FormData>(createUser, {});
  return (
    <form action={act} className="space-y-3">
      <label className="block"><span className="label">Name</span><input name="name" className="field" required /></label>
      <label className="block"><span className="label">Email</span><input name="email" type="email" className="field" required /></label>
      <label className="block"><span className="label">Role</span><select name="role" className="field" defaultValue="EDITOR"><option value="SUPER_ADMIN">Super admin — everything</option><option value="ADMIN">Admin — events, projects, members, attendance, content</option><option value="EDITOR">Editor — stories, projects, events, media</option><option value="ATTENDANCE_MANAGER">Attendance manager — meetings & attendance only</option></select></label>
      <button disabled={p} className="btn btn-royal !min-h-0 !py-2">Create user</button>
      {s.error && <p className="text-sm text-soil">{s.error}</p>}
      {s.password && <div className="rounded bg-royal p-3 text-white"><p className="text-xs uppercase text-gold">Temporary password — shown once</p><p className="font-mono text-lg">{s.password}</p></div>}
    </form>
  );
}

export function ResetPw({ id }: { id: string }) {
  const [pw, setPw] = useState<string | null>(null);
  const [p, start] = useTransition();
  return pw ? <span className="font-mono text-xs">{pw}</span> : <button disabled={p} onClick={() => start(async () => setPw(await resetPassword(id)))} className="text-xs underline">Reset password</button>;
}

export function OwnPassword() {
  const [s, act, p] = useActionState<U, FormData>(changeOwnPassword, {});
  return (
    <form action={act} className="max-w-sm space-y-3">
      <label className="block"><span className="label">Current password</span><input type="password" name="current" className="field" required autoComplete="current-password" /></label>
      <label className="block"><span className="label">New password (10+ characters)</span><input type="password" name="next" className="field" required autoComplete="new-password" /></label>
      <button disabled={p} className="btn btn-royal !min-h-0 !py-2">Change password</button>
      {s.error && <p className="text-sm text-soil">{s.error}</p>}{s.ok && <p className="text-sm text-leaf">Password changed ✓</p>}
    </form>
  );
}
