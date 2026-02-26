import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRecruiter, AuthenticatedRequest } from "@/lib/middleware/withAuth";

export const PATCH = withRecruiter(async (req: AuthenticatedRequest, ctx?: any) => {
  const params = await ctx?.params;
  const id = params?.id;
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  const body = await req.json();
  console.log("[CANDIDATE PATCH] id:", id, "body:", JSON.stringify(body));

  // Only pick fields that are safe to update
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.email !== undefined) data.email = body.email || null;
  if (body.phone !== undefined) data.phone = body.phone || null;
  if (body.location !== undefined) data.location = body.location || null;
  if (body.visaStatus !== undefined) data.visaStatus = body.visaStatus || null;
  if (body.rateExpectation !== undefined) data.rateExpectation = body.rateExpectation || null;
  if (body.availability !== undefined) data.availability = body.availability || null;
  if (body.employmentType !== undefined) data.employmentType = body.employmentType || null;
  if (body.resumeText !== undefined) data.resumeText = body.resumeText || null;
  if (body.status !== undefined) data.status = body.status;

  const candidate = await prisma.candidate.findUnique({ where: { id } });
  if (!candidate) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if (req.user.role !== "ADMIN" && candidate.recruiterId !== req.user.userId) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const updated = await prisma.candidate.update({
    where: { id },
    data,
  });

  return NextResponse.json({ data: updated });
});

export const DELETE = withRecruiter(async (req: AuthenticatedRequest, ctx?: any) => {
  const params = await ctx?.params;
  const id = params?.id;
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  const candidate = await prisma.candidate.findUnique({ where: { id } });
  if (!candidate) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if (req.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  await prisma.candidate.delete({ where: { id } });
  return NextResponse.json({ success: true });
});