import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdmin, AuthenticatedRequest } from "@/lib/middleware/withAuth";

export const DELETE = withAdmin(async (req: AuthenticatedRequest, ctx: any) => {
  const id = ctx?.params?.id;
  // Deactivate user but keep all their data
  await prisma.user.update({
    where: { id },
    data: { isActive: false, email: `deleted_${Date.now()}_${id}@deleted.com` },
  });
  return NextResponse.json({ success: true });
});

export const PATCH = withAdmin(async (req: AuthenticatedRequest, ctx: any) => {
  const id = ctx?.params?.id;
  const body = await req.json();
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.role && { role: body.role }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.managerId !== undefined && { managerId: body.managerId }),
    },
  });
  return NextResponse.json({ data: user });
});