import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getResource } from "@/lib/admin/resources";
import { toFormValues, fieldDefault } from "@/lib/admin/parse";
import { PageTitle, Badge } from "@/components/admin/ui";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { PinPanel } from "@/components/admin/PinPanel";
import { saveResource, deleteResource } from "../actions";
import { formatDateTime } from "@/lib/time";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const delegate = (model: string) => (db as any)[model];

export default async function ResourceEdit({ params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource, id } = await params;
  const res = getResource(resource);
  if (!res) notFound();
  await requireAdmin(res.perm);
  const isNew = id === "new";
  const row = isNew ? null : await delegate(res.model).findUnique({ where: { id } });
  if (!isNew && !row) notFound();

  const relationOptions: Record<string, { value: string; label: string }[]> = {};
  for (const f of res.fields) {
    if (f.type !== "relation" || !f.relation) continue;
    const opts = await delegate(f.relation.model).findMany({ where: f.relation.where, orderBy: f.relation.orderBy ?? { createdAt: "desc" }, take: 500 });
    relationOptions[f.name] = opts.map((o: Record<string, unknown>) => ({ value: String(o.id), label: String(o[f.relation!.label] ?? o.id) }));
  }
  const values = row ? toFormValues(res, row) : Object.fromEntries(res.fields.map((f) => [f.name, fieldDefault(f)]));
  if (isNew && res.fields.some((f) => f.name === "verification")) values.verification = "CLUB_RECORD";
  if (isNew && res.fields.some((f) => f.name === "status") && res.statusOptions?.includes("DRAFT")) values.status = "DRAFT";
  if (isNew && res.key === "events") { values.status = "APPROVED"; values.scope = "CLUB"; values.type = "CLUB_EVENT"; }
  const media = await db.media.findMany({ orderBy: { createdAt: "desc" }, take: 150, select: { url: true } });
  const publicPath = row && res.publicPath ? res.publicPath(row) : null;
  const title = isNew ? `New ${res.singular.toLowerCase()}` : String(row[res.titleField] ?? res.singular).replace(/_/g, " ");

  return (
    <>
      <p className="pt-2 text-sm"><Link href={`/admin/content/${res.key}`} className="text-muted underline">← {res.label}</Link></p>
      <PageTitle title={title}
        subtitle={row ? <>Updated {formatDateTime(row.updatedAt)} {row.status && <Badge value={row.status} />} {row.verification && <Badge value={row.verification} />}</> : res.help}
        actions={publicPath && (row.status === "PUBLISHED" || row.status === "APPROVED" || res.key === "dg-visits") ? <Link href={publicPath} target="_blank" className="btn btn-line !min-h-0 !py-2">View on site ↗</Link> : undefined} />
      {row?.importedAt && <p className="mb-4 rounded bg-gold/15 p-3 text-sm">Imported from <strong>{row.sourceLabel}</strong> on {formatDateTime(row.importedAt)} · last checked {formatDateTime(row.lastCheckedAt)}{row.sourceUrl && <> · <a className="underline" href={row.sourceUrl} target="_blank" rel="noreferrer">source ↗</a></>}</p>}
      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <ResourceForm fields={res.fields} values={values} relationOptions={relationOptions} action={saveResource.bind(null, res.key, isNew ? null : id)} mediaUrls={media.map((m) => m.url)} />
        {!isNew && (
          <aside className="space-y-4">
            {res.key === "members" && <PinPanel memberId={id} hasPin={!!row.pinHash} pinSetAt={row.pinSetAt ? formatDateTime(row.pinSetAt) : null} />}
            <div className="card p-4 text-xs text-muted">
              <p>Created {formatDateTime(row.createdAt)}</p>
              <p className="mt-1 break-all">ID {row.id}</p>
              <div className="mt-4 border-t border-ink/10 pt-3">
                <ConfirmButton action={deleteResource.bind(null, res.key, id)} label={`Delete ${res.singular.toLowerCase()}`} confirmText="Click again to permanently delete" />
              </div>
            </div>
          </aside>
        )}
      </div>
    </>
  );
}
