import { requireAdmin } from "@/lib/auth";
import { can, ROLE_LABEL } from "@/lib/permissions";
import { ADMIN_NAV } from "@/lib/admin/nav";
import { Sidebar } from "@/components/admin/Sidebar";
import { db } from "@/lib/db";
import { adminLogout } from "../login/actions";

export default async function Panel({ children }: { children: React.ReactNode }) {
  const u = await requireAdmin();
  const [inbox, events, messages] = await Promise.all([
    db.discoveredItem.count({ where: { status: "NEW" } }),
    db.event.count({ where: { status: "PENDING_REVIEW" } }),
    db.contactMessage.count({ where: { handled: false } }),
  ]);
  const badges: Record<string, number> = { "/admin/inbox": inbox + events, "/admin/messages": messages };
  const groups = ADMIN_NAV.map((g) => ({ group: g.group, items: g.items.filter((i) => !i.perm || can(u.role, i.perm)).map((i) => ({ ...i, badge: badges[i.href] })) })).filter((g) => g.items.length);
  return (
    <div className="lg:flex">
      <Sidebar groups={groups} user={{ name: u.name, role: ROLE_LABEL[u.role] }} />
      <div className="min-w-0 flex-1">
        <div className="flex justify-end px-6 pt-3"><form action={adminLogout}><button className="text-xs text-muted underline hover:text-ink">Sign out</button></form></div>
        <main id="main" className="px-4 pb-16 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
