import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/permissions";
import { PageTitle } from "@/components/admin/ui";
import { NewUserForm, ResetPw } from "@/components/admin/UserForms";
import { updateUser } from "./actions";
import { formatDateTime } from "@/lib/time";

export const metadata = { title: "Admin users" };
export default async function Users() {
  const me = await requireAdmin("users");
  const users = await db.user.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <>
      <PageTitle title="Admin users" subtitle="Who can manage the site, members and attendance." />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="card overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-xs uppercase text-muted"><tr><th className="px-4 py-2">User</th><th className="px-2 py-2">Role & access</th><th className="px-2 py-2">Last sign-in</th><th className="px-4 py-2" /></tr></thead>
          <tbody>{users.map((u) => (
            <tr key={u.id} className="border-t border-ink/5 align-top"><td className="px-4 py-2"><p className="font-semibold">{u.name}</p><p className="text-xs text-muted">{u.email}</p></td>
              <td className="px-2 py-2"><form action={updateUser.bind(null, u.id)} className="flex flex-wrap items-center gap-2"><select name="role" defaultValue={u.role} className="field !min-h-0 max-w-[190px] !py-1 text-xs" disabled={u.id === me.id}>{Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select><label className="flex items-center gap-1 text-xs"><input type="checkbox" name="active" defaultChecked={u.active} disabled={u.id === me.id} /> active</label>{u.id !== me.id && <button className="text-xs underline">Save</button>}</form></td>
              <td className="px-2 py-2 text-xs text-muted">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "never"}</td><td className="px-4 py-2 text-right">{u.id !== me.id && <ResetPw id={u.id} />}</td></tr>))}</tbody></table></div>
        <aside className="card h-fit p-5"><h2 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-soil">Add a user</h2><NewUserForm /></aside>
      </div>
    </>
  );
}
