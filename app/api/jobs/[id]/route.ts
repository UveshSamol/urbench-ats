import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRecruiter, AuthenticatedRequest } from "@/lib/middleware/withAuth";

export const PATCH = withRecruiter(async (req: AuthenticatedRequest, ctx?: any) => {
  const params = await ctx?.params;
  const id = params?.id;
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  const body = await req.json();
  console.log("[JOB PATCH] id:", id, "body:", JSON.stringify(body));

  // Only pick safe fields
  const data: any = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description || null;
  if (body.location !== undefined) data.location = body.location || null;
  if (body.type !== undefined) data.type = body.type;
  if (body.rate !== undefined) data.rate = body.rate || null;
  if (body.rateNumeric !== undefined) data.rateNumeric = body.rateNumeric ? Number(body.rateNumeric) : null;
  if (body.currency !== undefined) data.currency = body.currency || "USD";
  if (body.paymentType !== undefined) data.paymentType = body.paymentType || "Hourly";
  if (body.duration !== undefined) data.duration = body.duration || null;
  if (body.remote !== undefined) data.remote = body.remote || null;
  if (body.status !== undefined) data.status = body.status;

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if (req.user.role !== "ADMIN" && job.recruiterId !== req.user.userId) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const updated = await prisma.job.update({
    where: { id },
    data,
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