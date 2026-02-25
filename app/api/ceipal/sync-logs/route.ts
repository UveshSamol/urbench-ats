import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdmin, AuthenticatedRequest } from "@/lib/middleware/withAuth";

export const GET = withAdmin(async (req: AuthenticatedRequest) => {
  const url = new URL(req.url);
  const entityType = url.searchParams.get("entityType") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const limit = parseInt(url.searchParams.get("limit") || "50");

  const logs = await prisma.ceipalSyncLog.findMany({
    where: {
      ...(entityType && { entityType: entityType as any }),
      ...(status && { status: status as any }),
    },
    orderBy: { syncedAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ data: logs });
});