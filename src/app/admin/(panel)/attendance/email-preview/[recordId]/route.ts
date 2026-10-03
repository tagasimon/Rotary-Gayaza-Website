import { getAdmin } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { composeAttendanceEmail } from "@/lib/attendance-email";

// Preview the thank-you email exactly as it is sent for this sign-in
export async function GET(_: Request, { params }: { params: Promise<{ recordId: string }> }) {
  const u = await getAdmin();
  if (!u || !can(u.role, "attendance")) return new Response("Forbidden", { status: 403 });
  const id = (await params).recordId;
  const mail = await composeAttendanceEmail(id).catch(() => null);
  if (!mail) return new Response("Not found (or no email address)", { status: 404 });
  return new Response(mail.html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
