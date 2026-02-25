import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRecruiter, buildRecruiterFilter, AuthenticatedRequest } from "@/lib/middleware/withAuth";
import { matchCandidateToJob } from "@/lib/ai/ai.service";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  candidateId: z.string().min(1),
  jobId: z.string().min(1),
  highQuality: z.boolean().default(false),
});

export const POST = withRecruiter(async (req: AuthenticatedRequest) => {
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { candidateId, jobId, highQuality } = parsed.data;
  const recruiterFilter = buildRecruiterFilter(req.user);

  const [candidate, job] = await Promise.all([
    prisma.candidate.findFirst({ where: { id: candidateId, ...recruiterFilter } }),
    prisma.job.findFirst({ where: { id: jobId } }),
  ]);

  if (!candidate) return NextResponse.json({ error: "CANDIDATE_NOT_FOUND" }, { status: 404 });
  if (!job) return NextResponse.json({ error: "JOB_NOT_FOUND" }, { status: 404 });

  try {
    const aiResult = await matchCandidateToJob(candidate, job, highQuality);

    const match = await prisma.match.create({
      data: {
        candidateId,
        jobId,
        overallScore: aiResult.overallScore,
        moduleScore: aiResult.moduleScore,
        experienceScore: aiResult.experienceScore,
        industryScore: aiResult.industryScore,
        certificationScore: aiResult.certificationScore,
        strengths: aiResult.strengths,
        gaps: aiResult.gaps,
        recommendation: aiResult.recommendation,
        summary: aiResult.summary,
        nextSteps: aiResult.nextSteps,
        ranByUserId: req.user.userId,
      },
    });

    await auditLog({
      userId: req.user.userId,
      action: "MATCH_RUN",
      entityType: "match",
      entityId: match.id,
      metadata: { candidateId, jobId, score: aiResult.overallScore },
    });

    return NextResponse.json({ data: match });
  } catch (err: any) {
    console.error("[AI MATCH]", err);
    return NextResponse.json(
      { error: "AI_FAILED", message: "Match scoring failed. Try again." },
      { status: 502 }
    );
  }
});