import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAnyRole, withSales, AuthenticatedRequest } from "@/lib/middleware/withAuth";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1, "Client name required"),
  industry: z.string().optional(),
  rateAgreement: z.string().optional(),
  notes: z.string().optional(),
  website: z.string().optional(),
});

export const GET = withAnyRole(async (req: AuthenticatedRequest) => {
  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";

  const clients = await prisma.client.findMany({
    where: {
      isActive: true,
      ...(search && { name: { contains: search, mode: "insensitive" } }),
    },
    include: {
      pocs: { where: { isPrimary: true }, take: 1 },
      _count: { select: { jobs: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: clients });
});

export const POST = withSales(async (req: AuthenticatedRequest) => {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", issues: parsed.error.flatten() }, { status: 400 });
  }

  const client = await prisma.client.create({ data: parsed.data });
  return NextResponse.json({ data: client }, { status: 201 });
});