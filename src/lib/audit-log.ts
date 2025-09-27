import { prisma } from "./prisma";

export type AuditLogInput = {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  targetType: string;
  targetId: string;
  diff: unknown;
};

export async function recordAuditLog({
  actorId,
  actorEmail,
  action,
  targetType,
  targetId,
  diff,
}: AuditLogInput) {
  await prisma.auditLog.create({
    data: {
      actorId: actorId ?? null,
      actorEmail: actorEmail ?? null,
      action,
      targetType,
      targetId,
      diffJSON: diff ?? {},
    },
  });
}
