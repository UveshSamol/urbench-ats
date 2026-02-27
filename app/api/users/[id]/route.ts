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
  
  // FIX: Ensure password is processed BEFORE the update
  if (body.password) {
    const hash = await bcrypt.hash(body.password, 12);
    data.passwordHash = hash;
    // ADD: Force password change flag (optional but recommended)
    data.mustChangePassword = false; // Reset any forced change flags
  }

  const user = await prisma.user.update({ 
    where: { id }, 
    data,
    // ADD: Explicitly select fields to avoid leaking passwordHash
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      managerId: true,
      createdAt: true,
      updatedAt: true,
    }
  });
  
  return NextResponse.json({ data: user });
});