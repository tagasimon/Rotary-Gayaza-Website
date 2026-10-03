import { getAdmin } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { buildMakeupCard } from "@/lib/attendance-email";

// Download a guest's make-up card (the same PDF that is emailed to them)
export async function GET(_: Request, { params }: { params: Promise<{ recordId: string }> }) {
  const u = await getAdmin();
  if (!u || !can(u.role, "attendance")) return new Response("Forbidden", { status: 403 });
  const card = await buildMakeupCard((await params).recordId);
  if (!card) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(card.pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${card.filename}"`, "Cache-Control": "no-store" } });
}
