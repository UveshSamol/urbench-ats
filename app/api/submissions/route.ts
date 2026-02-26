import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withManager, AuthenticatedRequest } from "@/lib/middleware/withAuth";
import { auditLog } from "@/lib/audit";
import { generateId } from "@/lib/autoId";
import { notifyManagers, notifySalesManagers, createNotification } from "@/lib/notifications";
import { Role } from "@prisma/client";
import { z } from "zod";

const createSchema = z.object({
  candidateId: z.string().min(1),
  jobId: z.string().min(1),
  notes: z.string().optional(),
  interviewDate: z.string().optional(),
});

const updateSchema = z.object({
  status: z.enum([
    "pending_review",
    "approved_internally",
    "rejected_internally",
    "submitted_to_vendor",
    "submitted_to_client",
    "rejected_by_client",
    "placed",
    "withdrawn",
  ]),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  interviewDate: z.string().optional(),
  clientFeedback: z.string().optional(),
});

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || undefined;

  const where: any = {
    ...(status && { status }),
  };

  // Recruiters only see their own candidates' submissions
  if (req.user.role === Role.RECRUITER) {
    where.candidate = { recruiterId: req.user.userId };
  }

  const submissions = await prisma.submission.findMany({
    where,
    include: {
      candidate: { select: { id: true, candidateId: true, name: true, sapModules: true, visaStatus: true, recruiterId: true } },
      job: { select: { id: true, jobId: true, title: true, client: { select: { name: true } } } },
    },
    orderBy: { submissionDate: "desc" },
  });

  return NextResponse.json({ data: submissions });
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  // Only recruiters and recruiting managers can create submissions
  if (![Role.RECRUITER, Role.RECRUITING_MANAGER, Role.ADMIN].includes(req.user.role)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

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

  const submissionId = await generateId("SUB");

  // Get candidate and job info for notification
  const [candidate, job] = await Promise.all([
    prisma.candidate.findUnique({ where: { id: parsed.data.candidateId }, select: { name: true, candidateId: true } }),
    prisma.job.findUnique({ where: { id: parsed.data.jobId }, select: { title: true, jobId: true } }),
  ]);

  const submission = await prisma.submission.create({
    data: {
      submissionId,
      candidateId: parsed.data.candidateId,
      jobId: parsed.data.jobId,
      submittedById: req.user.userId,
      status: "pending_review",
      notes: parsed.data.notes || null,
      interviewDate: parsed.data.interviewDate ? new Date(parsed.data.interviewDate) : null,
    },
  });

  // Notify recruiting managers
  await notifyManagers({
    type: "submission_pending_review",
    title: "New Submission Pending Review",
    message: `${candidate?.name} (${candidate?.candidateId}) submitted for ${job?.title} (${job?.jobId})`,
    link: "/submissions",
  });

  await auditLog({
    userId: req.user.userId,
    action: "SUBMISSION_CREATED",
    entityType: "submission",
    entityId: submission.id,
  });

  return NextResponse.json({ data: submission }, { status: 201 });
});

export const PATCH = withAuth(async (req: AuthenticatedRequest, ctx?: any) => {
  const params = await ctx?.params;
  const id = params?.id;
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", issues: parsed.error.flatten() }, { status: 400 });
  }

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      candidate: { select: { name: true, candidateId: true, recruiterId: true } },
      job: { select: { title: true, jobId: true } },
    },
  });
  if (!submission) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const { status } = parsed.data;
  const role = req.user.role;

  // Permission check based on status transition
  const managerStatuses = ["approved_internally", "rejected_internally"];
  const salesStatuses = ["submitted_to_vendor", "submitted_to_client", "rejected_by_client", "placed", "withdrawn"];

  if (managerStatuses.includes(status) && ![Role.ADMIN, Role.RECRUITING_MANAGER].includes(role)) {
    return NextResponse.json({ error: "FORBIDDEN", message: "Only managers can approve or reject internally" }, { status: 403 });
  }

  if (salesStatuses.includes(status) && ![Role.ADMIN, Role.SALES_MANAGER, Role.SALES].includes(role)) {
    return NextResponse.json({ error: "FORBIDDEN", message: "Only sales can update client submission status" }, { status: 403 });
  }

  const updated = await prisma.submission.update({
    where: { id },
    data: {
      status: status as any,
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
      ...(parsed.data.internalNotes !== undefined && { internalNotes: parsed.data.internalNotes }),
      ...(parsed.data.clientFeedback !== undefined && { clientFeedback: parsed.data.clientFeedback }),
      ...(parsed.data.interviewDate && { interviewDate: new Date(parsed.data.interviewDate) }),
      reviewedById: req.user.userId,
    },
  });

  // Send notifications based on status change
  if (status === "approved_internally") {
    await notifySalesManagers({
      type: "submission_approved",
      title: "Submission Approved — Ready for Client",
      message: `${submission.candidate.name} approved for ${submission.job.title}. Ready to submit to client.`,
      link: "/submissions",
    });
  }

  if (status === "rejected_internally") {
    await createNotification({
      userId: submission.candidate.recruiterId,
      type: "submission_rejected",
      title: "Submission Rejected Internally",
      message: `${submission.candidate.name}'s submission for ${submission.job.title} was rejected internally.`,
      link: "/submissions",
    });
  }

  if (status === "rejected_by_client") {
    await createNotification({
      userId: submission.candidate.recruiterId,
      type: "client_rejected",
      title: "Rejected by Client",
      message: `${submission.candidate.name} was rejected by the client for ${submission.job.title}.`,
      link: "/submissions",
    });
  }

  if (status === "placed") {
    await notifyManagers({
      type: "placement_made",
      title: "🎉 Placement Made!",
      message: `${submission.candidate.name} has been placed for ${submission.job.title}!`,
      link: "/submissions",
    });
  }

  return NextResponse.json({ data: updated });
});