import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withSales, withRecruiter, AuthenticatedRequest } from "@/lib/middleware/withAuth";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

const createSchema = z.object({
  candidateId: z.string().min(1),
  jobId: z.string().min(1),
  revenue: z.number().optional(),
  margin: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  contractType: z.enum(["Contract", "Permanent", "ContractToHire"]),
  aiScore: z.number().int().min(0).max(100).optional(),
  notes: z.string().optional(),
});

export const GET = withSales(async (req: AuthenticatedRequest) => {
  const url = new URL(req.url);
  const recruiterId = url.searchParams.get("recruiterId") || undefined;
  const from = url.searchParams.get("from") ? new Date(url.searchParams.get("from")!) : undefined;
  const to = url.searchParams.get("to") ? new Date(url.searchParams.get("to")!) : undefined;

  const placements = await prisma.placement.findMany({
    where: {
      ...(recruiterId && { recruiterId }),
      ...(from && to && { createdAt: { gte: from, lte: to } }),
    },
    include: {
      candidate: { select: { id: true, name: true, sapModules: true } },
      job: { select: { id: true, title: true, client: { select: { name: true } } } },
      recruiter: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalRevenue = placements.reduce((s, p) => s + (p.revenue || 0), 0);
  const totalMargin = placements.reduce((s, p) => s + (p.margin || 0), 0);

  return NextResponse.json({
    data: placements,
    summary: { totalRevenue, totalMargin, count: placements.length },
  });
});

export const POST = withRecruiter(async (req: AuthenticatedRequest) => {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", issues: parsed.error.flatten() }, { status: 400 });
  }

  const placement = await prisma.placement.create({
    data: {
      ...parsed.data,
      recruiterId: req.user.userId,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
    },
  });

  await prisma.candidate.update({
    where: { id: parsed.data.candidateId },
    data: { status: "placed" },
  });

  await prisma.job.update({
    where: { id: parsed.data.jobId },
    data: { status: "Filled" },
  });

  await auditLog({
    userId: req.user.userId,
    action: "PLACEMENT_LOGGED",
    entityType: "placement",
    entityId: placement.id,
    metadata: { revenue: parsed.data.revenue },
  });

  return NextResponse.json({ data: placement }, { status: 201 });
});