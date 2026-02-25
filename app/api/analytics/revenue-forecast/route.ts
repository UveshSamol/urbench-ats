import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withSales, AuthenticatedRequest } from "@/lib/middleware/withAuth";

export const GET = withSales(async (_req: AuthenticatedRequest) => {
  const activePlacements = await prisma.placement.findMany({
    where: {
      contractType: "Contract",
      endDate: { gt: new Date() },
    },
    include: {
      job: { select: { rateNumeric: true, title: true } },
      candidate: { select: { name: true } },
      recruiter: { select: { name: true } },
    },
  });

  const forecast = activePlacements.map((p) => {
    const msRemaining = p.endDate ? p.endDate.getTime() - Date.now() : 0;
    const monthsRemaining = Math.max(0, msRemaining / (30 * 24 * 60 * 60 * 1000));
    const rate = p.job.rateNumeric || 0;
    const projected = Math.round(rate * 160 * monthsRemaining);

    return {
      placementId: p.id,
      candidate: p.candidate.name,
      job: p.job.title,
      recruiter: p.recruiter.name,
      endDate: p.endDate,
      monthsRemaining: Math.round(monthsRemaining * 10) / 10,
      hourlyRate: rate,
      projectedRevenue: projected,
    };
  });

  const total = forecast.reduce((s, f) => s + f.projectedRevenue, 0);

  return NextResponse.json({
    data: forecast,
    summary: {
      totalForecast: total,
      activePlacements: forecast.length,
    },
  });
});