import { prisma } from "@/lib/prisma";
import { matchCandidateToJob } from "@/lib/ai/ai.service";

const TOP_N = 5;

export async function autoShortlistForJob(jobId: string): Promise<void> {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || job.autoShortlisted) return;

  const candidates = await prisma.candidate.findMany({
    where: {
      status: { in: ["sourcing", "screening"] },
      sapModules: { hasSome: job.requiredModules },
    },
    take: 50,
  });

  if (candidates.length === 0) {
    await prisma.job.update({ where: { id: jobId }, data: { autoShortlisted: true } });
    return;
  }

  const scoredResults: Array<{ candidateId: string; score: number; result: any }> = [];

  for (const candidate of candidates) {
    try {
      const result = await matchCandidateToJob(candidate, job);
      scoredResults.push({ candidateId: candidate.id, score: result.overallScore, result });
    } catch (err) {
      console.warn(`[AUTO-SHORTLIST] Failed to score candidate ${candidate.id}:`, err);
    }
  }

  const topN = scoredResults.sort((a, b) => b.score - a.score).slice(0, TOP_N);

  await prisma.$transaction(
    topN.map(({ candidateId, result }) =>
      prisma.match.create({
        data: {
          candidateId,
          jobId,
          overallScore: result.overallScore,
          moduleScore: result.moduleScore,
          experienceScore: result.experienceScore,
          industryScore: result.industryScore,
          certificationScore: result.certificationScore,
          strengths: result.strengths,
          gaps: result.gaps,
          recommendation: result.recommendation,
          summary: result.summary,
          nextSteps: result.nextSteps,
          isAutoShortlist: true,
        },
      })
    )
  );

  await prisma.job.update({ where: { id: jobId }, data: { autoShortlisted: true } });
  console.log(`[AUTO-SHORTLIST] Job ${jobId}: stored top ${topN.length} matches`);
}