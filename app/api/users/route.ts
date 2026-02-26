import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdmin, AuthenticatedRequest } from "@/lib/middleware/withAuth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["ADMIN", "RECRUITER", "SALES"]),
  managerId: z.string().optional(),
  password: z.string().min(8).default("Welcome1234!"),
});

export const GET = withAdmin(async (req: AuthenticatedRequest) => {
  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, role: true,
      isActive: true, createdAt: true, lastLoginAt: true,
      managerId: true,
      _count: { select: { candidates: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ data: users });
});

export const POST = withAdmin(async (req: AuthenticatedRequest) => {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR", issues: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return NextResponse.json({ error: "EMAIL_EXISTS" }, { status: 409 });

  const hash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash: hash,
      managerId: parsed.data.managerId || null,
    },
  });
  return NextResponse.json({ data: user }, { status: 201 });
});