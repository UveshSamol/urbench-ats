import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRecruiter, buildRecruiterFilter, AuthenticatedRequest } from "@/lib/middleware/withAuth";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

const createSchema = z.object({
  candidateId: z.string().min(1),
  jobId: z.string().min(1),
  notes: z.string().optional(),
  interviewDate: z.string().optional(),
  status: z.enum(["submitted", "reviewing", "interviewing", "offered", "placed", "rejected", "withdrawn"]).default("submitted"),
});

export const GET = withRecruiter(async (req: AuthenticatedRequest) => {
  const recruiterFilter = buildRecruiterFilter(req.user);
  const url = new URL(req.url);

  const submissions = await prisma.submission.findMany({
    where: {
      candidate: recruiterFilter.recruiterId
        ? { recruiterId: recruiterFilter.recruiterId }
        : undefined,
    },
    include: {
      candidate: { select: { id: true, name: true, sapModules: true, visaStatus: true } },
      job: { select: { id: true, title: true, client: { select: { name: true } } } },
    },
    orderBy: { submissionDate: "desc" },
  });

  return NextResponse.json({ data: submissions });
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

  const existing = await prisma.submission.findUnique({
    where: {
      candidateId_jobId: {
        candidateId: parsed.data.candidateId,
        jobId: parsed.data.jobId,
      },
    },
  });

  if (existing) {
    return NextResponse.json({
      error: "ALREADY_SUBMITTED",
      message: "This candidate is already submitted for this job",
      existingId: existing.id,
    }, { status: 409 });
  }

  const submission = await prisma.submission.create({
    data: {
      candidateId: parsed.data.candidateId,
      jobId: parsed.data.jobId,
      submittedById: req.user.userId,
      status: parsed.data.status as any,
      notes: parsed.data.notes || null,
      interviewDate: parsed.data.interviewDate
        ? new Date(parsed.data.interviewDate)
        : null,
    },
  });


  await prisma.candidate.update({
    where: { id: parsed.data.candidateId },
    data: { status: "submitted" },
  });

  await auditLog({
    userId: req.user.userId,
    action: "SUBMISSION_CREATED",
    entityType: "submission",
    entityId: submission.id,
  });

  return NextResponse.json({ data: submission }, { status: 201 });
});