import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRecruiter, AuthenticatedRequest } from "@/lib/middleware/withAuth";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  type: z.enum(["Contract","Permanent","ContractToHire"]).optional(),
  rate: z.string().optional(),
  rateNumeric: z.number().optional(),
  currency: z.string().optional(),
  paymentType: z.string().optional(),
  duration: z.string().optional(),
  remote: z.string().optional(),
  status: z.string().optional(),
});

export const PATCH = withRecruiter(async (req: AuthenticatedRequest, ctx?: any) => {
  const params = await ctx?.params;
  const id = params?.id;
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR", issues: parsed.error.flatten() }, { status: 400 });

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if (req.user.role !== "ADMIN" && job.recruiterId !== req.user.userId) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const updated = await prisma.job.update({
    where: { id },
    data: { ...parsed.data } as any,
  });

  return NextResponse.json({ data: updated });
});

export const DELETE = withRecruiter(async (req: AuthenticatedRequest, ctx?: any) => {
  const params = await ctx?.params;
  const id = params?.id;
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if (req.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  await prisma.job.delete({ where: { id } });
  return NextResponse.json({ success: true });
});