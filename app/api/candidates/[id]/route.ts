    import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRecruiter, AuthenticatedRequest } from "@/lib/middleware/withAuth";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  location: z.string().optional(),
  visaStatus: z.string().optional(),
  rateExpectation: z.string().optional(),
  availability: z.string().optional(),
  employmentType: z.string().optional(),
  status: z.enum(["sourcing","screening","submitted","interviewing","offered","placed","rejected"]).optional(),
  resumeText: z.string().optional(),
});

export const PATCH = withRecruiter(async (req: AuthenticatedRequest, ctx?: any) => {
  const id = ctx?.params?.id;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", issues: parsed.error.flatten() }, { status: 400 });
  }

  // Check ownership — recruiter can only edit their own, admin can edit all
  const candidate = await prisma.candidate.findUnique({ where: { id } });
  if (!candidate) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if (req.user.role !== "ADMIN" && candidate.recruiterId !== req.user.userId) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const updated = await prisma.candidate.update({
    where: { id },
    data: {
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.email !== undefined && { email: parsed.data.email || null }),
      ...(parsed.data.phone !== undefined && { phone: parsed.data.phone || null }),
      ...(parsed.data.location !== undefined && { location: parsed.data.location || null }),
      ...(parsed.data.visaStatus !== undefined && { visaStatus: parsed.data.visaStatus || null }),
      ...(parsed.data.rateExpectation !== undefined && { rateExpectation: parsed.data.rateExpectation || null }),
      ...(parsed.data.availability !== undefined && { availability: parsed.data.availability || null }),
      ...(parsed.data.employmentType !== undefined && { employmentType: parsed.data.employmentType || null }),
      ...(parsed.data.status && { status: parsed.data.status }),
      ...(parsed.data.resumeText !== undefined && { resumeText: parsed.data.resumeText || null }),
    },
  });

  return NextResponse.json({ data: updated });
});

export const DELETE = withRecruiter(async (req: AuthenticatedRequest, ctx?: any) => {
  const id = ctx?.params?.id;

  const candidate = await prisma.candidate.findUnique({ where: { id } });
  if (!candidate) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if (req.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  await prisma.candidate.delete({ where: { id } });
  return NextResponse.json({ success: true });
});