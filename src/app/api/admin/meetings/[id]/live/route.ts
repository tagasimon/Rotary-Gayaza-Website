import { db } from "@/lib/db";
import { getAdmin } from "@/lib/auth";
import { can } from "@/lib/permissions";
export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getAdmin();
  if (!u || !can(u.role, "attendance")) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const [members, guests] = await Promise.all([
    db.attendanceRecord.count({ where: { meetingId: id, memberId: { not: null }, status: { not: "EXCUSED" } } }),
    db.attendanceRecord.count({ where: { meetingId: id, memberId: null } }),
  ]);
  return Response.json({ members, guests });
}
