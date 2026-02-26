import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRecruiter, buildRecruiterFilter, AuthenticatedRequest } from "@/lib/middleware/withAuth";
import { detectDuplicate } from "@/lib/ai/ai.service";
import { auditLog } from "@/lib/audit";
import { generateId } from "@/lib/autoId";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  location: z.string().optional(),
  yearsExperience: z.number().int().min(0).max(50).optional(),
  sapModules: z.array(z.string()).default([]),
  otherErp: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  industries: z.array(z.string()).default([]),
  visaStatus: z.string().optional(),
  availability: z.string().optional(),
  rateExpectation: z.string().optional(),
  employmentType: z.string().optional(),
  resumeText: z.string().optional(),
  aiSummary: z.string().optional(),
  status: z.enum(["sourcing","screening","submitted","interviewing","offered","placed","rejected"]).default("sourcing"),
});

export const GET = withRecruiter(async (req: AuthenticatedRequest) => {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, parseInt(url.searchParams.get("limit") || "25"));
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || undefined;
  const module_ = url.searchParams.get("module") || undefined;

  const recruiterFilter = buildRecruiterFilter(req.user);

  const where: any = {
    ...recruiterFilter,
    ...(status && { status }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { candidateId: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(module_ && { sapModules: { has: module_ } }),
  };

  const [candidates, total] = await Promise.all([
    prisma.candidate.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        recruiter: { select: { id: true, name: true } },
        _count: { select: { submissions: true, matches: true } },
      },
    }),
    prisma.candidate.count({ where }),
  ]);

  return NextResponse.json({
    data: candidates,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const POST = withRecruiter(async (req: AuthenticatedRequest) => {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Safe duplicate check
  if (parsed.data.email || parsed.data.phone) {
    try {
      const dupCheck = await detectDuplicate(parsed.data.email, parsed.data.phone);
      if (dupCheck.isDuplicate) {
        return NextResponse.json({
          error: "DUPLICATE_CANDIDATE",
          message: "A candidate with this email or phone already exists",
          existingId: dupCheck.existingId,
        }, { status: 409 });
      }
    } catch (e) {
      console.error("[CANDIDATE POST] duplicate check failed:", e);
    }
  }

  const candidateId = await generateId("CAN");

  const candidate = await prisma.candidate.create({
    data: {
      candidateId,
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      location: parsed.data.location || null,
      yearsExperience: parsed.data.yearsExperience ?? null,
      sapModules: parsed.data.sapModules,
      otherErp: parsed.data.otherErp,
      certifications: parsed.data.certifications,
      industries: parsed.data.industries,
      visaStatus: parsed.data.visaStatus || null,
      availability: parsed.data.availability || null,
      rateExpectation: parsed.data.rateExpectation || null,
      employmentType: parsed.data.employmentType || null,
      resumeText: parsed.data.resumeText || null,
      aiSummary: parsed.data.aiSummary || null,
      status: parsed.data.status,
      recruiterId: req.user.userId,
    },
  });

  await auditLog({
    userId: req.user.userId,
    action: "CANDIDATE_CREATED",
    entityType: "candidate",
    entityId: candidate.id,
  });

  return NextResponse.json({ data: candidate }, { status: 201 });
});