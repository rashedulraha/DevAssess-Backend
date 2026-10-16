import { Prisma } from '@prisma/client';
import { prisma } from './prisma';

interface IAuditLogParams {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string | null;
  tx?: Prisma.TransactionClient;
}

export const logAudit = async ({
  actorId,
  action,
  entityType,
  entityId,
  oldValue,
  newValue,
  ipAddress,
  tx,
}: IAuditLogParams) => {
  const client = tx || prisma;

  return client.auditLog.create({
    data: {
      actorId,
      action,
      entityType,
      entityId,
      oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : undefined,
      newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : undefined,
      ipAddress: ipAddress || null,
    },
  });
};
