import { prisma } from "@/lib/prisma";

export async function auditLog(data: {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({ data });
  } catch (err) {
    console.error("[AUDIT LOG ERROR]", err);
  }
}