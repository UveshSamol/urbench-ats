import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware/withAuth";

export const DELETE = withAuth(async (req: AuthenticatedRequest, ctx: any) => {
  const params = await ctx?.params;
  const id = params?.id;
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });
  return NextResponse.json({ success: true });
});

export const PATCH = withAuth(async (req: AuthenticatedRequest, ctx: any) => {
  const params = await ctx?.params;
  const id = params?.id;
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  const body = await req.json();

  const data: any = {};
  if (body.name) data.name = body.name;
  if (body.role) data.role = body.role;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.managerId !== undefined) data.managerId = body.managerId;
  if (body.password) {
    data.passwordHash = await bcrypt.hash(body.password, 12);
  }

  const user = await prisma.user.update({ where: { id }, data });
  return NextResponse.json({ data: user });
});