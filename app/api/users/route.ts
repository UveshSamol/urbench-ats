import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/middleware/withAuth";
import { prisma } from "@/lib/prisma";
import { createUser } from "@/lib/auth/auth.service";
import { z } from "zod";
import { Role } from "@prisma/client";

/* ─────────────── GET ALL USERS (ADMIN ONLY) ─────────────── */
export const GET = withAdmin(async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: users });
});

/* ─────────────── CREATE USER (ADMIN ONLY) ─────────────── */
const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(Role),
});

export const POST = withAdmin(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, password, role } = parsed.data;

  try {
    const user = await createUser({
      name,
      email,
      password,
      role,
    });

    return NextResponse.json({ message: "User created", user });
  } catch (err: any) {
    if (err.message === "EMAIL_ALREADY_EXISTS") {
      return NextResponse.json(
        { error: "EMAIL_ALREADY_EXISTS" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
});