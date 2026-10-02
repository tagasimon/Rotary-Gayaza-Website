import { db } from "./db";
import type { AdminUser } from "./auth";
import type { Prisma } from "@prisma/client";

export async function audit(
  actor: Pick<AdminUser, "id" | "name"> | null,
  action: string,
  entity: string,
  entityId?: string | null,
  summary?: string,
  meta?: Prisma.InputJsonValue,
) {
  try {
    await db.auditLog.create({
      data: { userId: actor?.id ?? null, actorName: actor?.name ?? "system", action, entity, entityId: entityId ?? null, summary, meta },
    });
  } catch (e) {
    console.error("audit failed", e);
  }
}
