import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PageTitle, Empty } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/time";

export const metadata = { title: "Messages" };

async function toggle(id: string, handled: boolean) {
  "use server";
  await requireAdmin("messages");
  await db.contactMessage.update({ where: { id }, data: { handled } });
  revalidatePath("/admin/messages");
}

export default async function Messages() {
  await requireAdmin("messages");
  const msgs = await db.contactMessage.findMany({ orderBy: [{ handled: "asc" }, { createdAt: "desc" }], take: 200 });
  return (
    <>
      <PageTitle title="Contact messages" subtitle="From the website contact form." />
      {msgs.length === 0 ? <Empty>No messages yet.</Empty> : (
        <ul className="space-y-3">
          {msgs.map((m) => (
            <li key={m.id} className={`card p-4 ${m.handled ? "opacity-60" : "border-l-4 border-l-gold"}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><p className="font-semibold">{m.name} <span className="font-normal text-muted">· {m.interest ?? "general"}</span></p><p className="text-sm"><a className="underline" href={`mailto:${m.email}`}>{m.email}</a>{m.phone && ` · ${m.phone}`}</p></div>
                <div className="flex items-center gap-3 text-xs text-muted">{formatDateTime(m.createdAt)}<form action={toggle.bind(null, m.id, !m.handled)}><button className="btn btn-line !min-h-0 !py-1 text-xs">{m.handled ? "Mark unhandled" : "Mark handled"}</button></form></div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
