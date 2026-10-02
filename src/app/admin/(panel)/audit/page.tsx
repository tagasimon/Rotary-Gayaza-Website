import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PageTitle, Pager } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/time";

export const metadata = { title: "Audit log" };
export default async function Audit({ searchParams }: { searchParams: Promise<{ page?: string; entity?: string }> }) {
  await requireAdmin("audit");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = sp.entity ? { entity: sp.entity } : {};
  const [rows, total, entities] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 50, take: 50 }),
    db.auditLog.count({ where }),
    db.auditLog.findMany({ distinct: ["entity"], select: { entity: true } }),
  ]);
  return (
    <>
      <PageTitle title="Audit log" subtitle="Important administrative actions, newest first." />
      <form className="mb-3"><select name="entity" defaultValue={sp.entity ?? ""} className="field max-w-xs"><option value="">All entities</option>{entities.map((e) => <option key={e.entity}>{e.entity}</option>)}</select> <button className="btn btn-line !min-h-0 !py-2">Filter</button></form>
      <div className="card overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-xs uppercase text-muted"><tr><th className="px-4 py-2">When</th><th className="px-2 py-2">Who</th><th className="px-2 py-2">Action</th><th className="px-2 py-2">Entity</th><th className="px-4 py-2">Summary</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id} className="border-t border-ink/5"><td className="whitespace-nowrap px-4 py-1.5 text-muted">{formatDateTime(r.createdAt)}</td><td className="px-2 py-1.5">{r.actorName}</td><td className="px-2 py-1.5 font-semibold">{r.action}</td><td className="px-2 py-1.5">{r.entity}</td><td className="px-4 py-1.5 text-ink-2">{r.summary}</td></tr>)}</tbody></table></div>
      <Pager page={page} pages={Math.ceil(total / 50)} base={`/admin/audit${sp.entity ? `?entity=${sp.entity}` : ""}`} />
    </>
  );
}
