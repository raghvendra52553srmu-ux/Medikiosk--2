import { prisma } from "../config/prisma.js";

/**
 * Append-only trail. Deliberately never throws: an audit failure must not
 * roll back the clinical action the user just performed.
 */
export async function recordAudit(input, tx) {
  const client = tx ?? prisma;
  try {
    await client.auditLog.create({
      data: {
        actorType: input.actorType,
        staffId: input.staffId ?? null,
        sessionId: input.sessionId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        meta: input.meta,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[audit] failed to write entry", input.action, err);
  }
}
