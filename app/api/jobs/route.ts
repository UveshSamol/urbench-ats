import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRecruiter, AuthenticatedRequest } from "@/lib/middleware/withAuth";
import { auditLog } from "@/lib/audit";
import { autoShortlistForJob } from "@/lib/jobs/auto-shortlist";
import { z } from "zod";

const createSchema = z.object({
  clientId: z.string().min(1, "Client required"),
  title: z.string().min(1, "Title required"),
  location: z.string().optional(),
  type: z.enum(["Contract", "Permanent", "ContractToHire"]),
  duration: z.string().optional(),
  durationMonths: z.number().int().optional(),
  rate: z.string().optional(),
  rateNumeric: z.number().optional(),
  requiredModules: z.array(z.string()).default([]),
  preferredModules: z.array(z.string()).default([]),
  requiredYears: z.number().int().optional(),
  requiredCerts: z.array(z.string()).default([]),
  industries: z.array(z.string()).default([]),
  visaSponsorship: z.string().optional(),
  remote: z.string().optional(),
  description: z.string().optional(),
  runAutoShortlist: z.boolean().default(false),
});

export const GET = withRecruiter(async (req: AuthenticatedRequest) => {
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || undefined;
  const clientId = url.searchParams.get("clientId") || undefined;
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, parseInt(url.searchParams.get("limit") || "25"));

  const where: any = {
    ...(status && { status }),
    ...(clientId && { clientId }),
  };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true } },
        recruiter: { select: { id: true, name: true } },
        _count: { select: { submissions: true, matches: true } },
      },
    }),
    prisma.job.count({ where }),
  ]);

  return NextResponse.json({
    data: jobs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const POST = withRecruiter(async (req: AuthenticatedRequest) => {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { runAutoShortlist, ...jobData } = parsed.data;

  const job = await prisma.job.create({
    data: { ...jobData, recruiterId: req.user.userId },
  });

  await auditLog({ userId: req.user.userId, action: "JOB_CREATED", entityType: "job", entityId: job.id });

  if (runAutoShortlist) {
    autoShortlistForJob(job.id).catch(err => console.error("[AUTO-SHORTLIST]", err));
  }

  return NextResponse.json({ data: job }, { status: 201 });
});