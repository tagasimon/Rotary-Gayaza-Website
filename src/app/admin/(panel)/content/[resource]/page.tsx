import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getResource } from "@/lib/admin/resources";
import { PageTitle, Badge, Empty, Pager } from "@/components/admin/ui";
import { formatDate, formatDateTime } from "@/lib/time";

const PER = 30;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const delegate = (model: string) => (db as any)[model];

export default async function ResourceList({ params, searchParams }: { params: Promise<{ resource: string }>; searchParams: Promise<{ q?: string; status?: string; v?: string; page?: string }> }) {
  const res = getResource((await params).resource);
  if (!res) notFound();
  await requireAdmin(res.perm);
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Record<string, unknown> = {};
  if (sp.q) where.OR = res.search.map((k) => ({ [k]: { contains: sp.q, mode: "insensitive" } }));
  if (sp.status && res.statusOptions?.includes(sp.status)) where.status = sp.status;
  if (sp.v && ["VERIFIED", "CLUB_RECORD", "NEEDS_CONFIRMATION"].includes(sp.v)) where.verification = sp.v;
  const hasVerification = res.fields.some((f) => f.name === "verification");
  const [rows, total] = await Promise.all([
    delegate(res.model).findMany({ where, orderBy: res.orderBy, skip: (page - 1) * PER, take: PER }),
    delegate(res.model).count({ where }),
  ]);
  // resolve relation labels for list columns
  const relLabels: Record<string, Record<string, string>> = {};
  for (const col of res.columns) {
    const f = res.fields.find((x) => x.name === col);
    if (f?.type === "relation" && f.relation) {
      const ids = [...new Set(rows.map((r: Record<string, unknown>) => r[col]).filter(Boolean))];
      const rel = await delegate(f.relation.model).findMany({ where: { id: { in: ids } } });
      relLabels[col] = Object.fromEntries(rel.map((r: Record<string, unknown>) => [r.id, String(r[f.relation!.label])]));
    }
  }
  const fmt = (col: string, v: unknown) => {
    const f = res.fields.find((x) => x.name === col);
    if (v === null || v === undefined || v === "") return <span className="text-muted">—</span>;
    if (["status", "verification", "scope"].includes(col)) return <Badge value={String(v)} />;
    if (typeof v === "boolean") return v ? "✓" : "";
    if (v instanceof Date) return f?.type === "datetime" ? formatDateTime(v) : formatDate(v, "short");
    if (f?.type === "relation") return relLabels[col]?.[String(v)] ?? "—";
    if (f?.type === "image") return <span className="block max-w-[180px] truncate text-xs text-muted">{String(v)}</span>;
    return String(v).replace(/_/g, " ");
  };
  const base = `/admin/content/${res.key}?${new URLSearchParams(Object.entries({ q: sp.q, status: sp.status, v: sp.v }).filter(([, x]) => x) as [string, string][]).toString()}`;
  return (
    <>
      <PageTitle title={res.label} subtitle={res.help ?? `${total} record${total === 1 ? "" : "s"}`} actions={<Link href={`/admin/content/${res.key}/new`} className="btn btn-royal !min-h-0 !py-2">New {res.singular.toLowerCase()}</Link>} />
      <form className="mb-4 flex flex-wrap gap-2" method="get">
        <input name="q" defaultValue={sp.q} placeholder="Search…" className="field max-w-xs" />
        {res.statusOptions && <select name="status" defaultValue={sp.status ?? ""} className="field max-w-[180px]"><option value="">Any status</option>{res.statusOptions.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ").toLowerCase()}</option>)}</select>}
        {hasVerification && <select name="v" defaultValue={sp.v ?? ""} className="field max-w-[200px]"><option value="">Any verification</option><option value="VERIFIED">Verified</option><option value="CLUB_RECORD">Club record</option><option value="NEEDS_CONFIRMATION">Needs confirmation</option></select>}
        <button className="btn btn-line !min-h-0 !py-2">Filter</button>
      </form>
      {rows.length === 0 ? <Empty>Nothing here yet.</Empty> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-muted"><tr>{res.columns.map((c) => <th key={c} className="px-3 py-2 font-semibold">{res.fields.find((f) => f.name === c)?.label ?? c}</th>)}<th className="px-3 py-2" /></tr></thead>
            <tbody>
              {rows.map((r: Record<string, unknown>) => (
                <tr key={String(r.id)} className="border-b border-ink/5 last:border-0 hover:bg-paper">
                  {res.columns.map((c, i) => <td key={c} className="px-3 py-2 align-top">{i === 0 ? <Link href={`/admin/content/${res.key}/${r.id}`} className="font-semibold text-royal hover:underline">{fmt(c, r[c])}</Link> : fmt(c, r[c])}</td>)}
                  <td className="px-3 py-2 text-right"><Link href={`/admin/content/${res.key}/${r.id}`} className="text-xs underline">Edit</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={page} pages={Math.ceil(total / PER)} base={base} />
    </>
  );
}
