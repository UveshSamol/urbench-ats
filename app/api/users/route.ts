import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdmin, AuthenticatedRequest } from "@/lib/middleware/withAuth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["ADMIN", "RECRUITER", "SALES", "RECRUITING_MANAGER", "SALES_MANAGER"]),
  managerId: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
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
  try {
    const body = await req.json();
    
    // Manual validation with better error messages
    if (!body.name || body.name.trim() === "") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    
    if (!body.email || body.email.trim() === "") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    
    if (!body.role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }
    
    // Validate with Zod
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      console.error("Validation error:", parsed.error);
      return NextResponse.json({ 
        error: "VALIDATION_ERROR", 
        details: parsed.error.flatten(),
        message: parsed.error.errors[0]?.message || "Validation failed"
      }, { status: 400 });
    }

    // Check if email exists
    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      return NextResponse.json({ error: "EMAIL_EXISTS", message: "Email already exists" }, { status: 409 });
    }

    // Use provided password or default
    const password = parsed.data.password && parsed.data.password.trim() !== "" 
      ? parsed.data.password 
      : "Welcome1234!";
    
    // Hash password
    const hash = await bcrypt.hash(password, 12);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        passwordHash: hash,
        managerId: parsed.data.managerId || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    });
    
    return NextResponse.json({ data: user }, { status: 201 });
    
  } catch (error: any) {
    console.error("User creation error:", error);
    return NextResponse.json({ 
      error: "SERVER_ERROR", 
      message: error.message || "Failed to create user" 
    }, { status: 500 });
  }
});