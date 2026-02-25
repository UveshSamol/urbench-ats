import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdmin, AuthenticatedRequest } from "@/lib/middleware/withAuth";

export const GET = withAdmin(async (req: AuthenticatedRequest) => {
  const url = new URL(req.url);
  const from = url.searchParams.get("from")
    ? new Date(url.searchParams.get("from")!)
    : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const to = url.searchParams.get("to")
    ? new Date(url.searchParams.get("to")!)
    : new Date();

  const recruiters = await prisma.user.findMany({
    where: { role: "RECRUITER", isActive: true },
    select: { id: true, name: true, email: true },
  });

  const analytics = await Promise.all(
    recruiters.map(async (r) => {
      const [candidates, submissions, placements, avgScore] = await Promise.all([
        prisma.candidate.count({
          where: { recruiterId: r.id, createdAt: { gte: from, lte: to } },
        }),
        prisma.submission.count({
          where: { candidate: { recruiterId: r.id }, submissionDate: { gte: from, lte: to } },
        }),
        prisma.placement.findMany({
          where: { recruiterId: r.id, createdAt: { gte: from, lte: to } },
          select: { revenue: true, margin: true },
        }),
        prisma.match.aggregate({
          where: { ranByUserId: r.id, createdAt: { gte: from, lte: to } },
          _avg: { overallScore: true },
        }),
      ]);

      return {
        recruiter: r,
        metrics: {
          candidates,
          submissions,
          placements: placements.length,
          revenue: placements.reduce((s, p) => s + (p.revenue || 0), 0),
          margin: placements.reduce((s, p) => s + (p.margin || 0), 0),
          conversionRate: submissions > 0
            ? `${((placements.length / submissions) * 100).toFixed(1)}%`
            : "0%",
          avgMatchScore: Math.round(avgScore._avg.overallScore || 0),
        },
      };
    })
  );

  return NextResponse.json({ data: analytics, period: { from, to } });
});