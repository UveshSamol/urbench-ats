import { NextResponse } from "next/server";
import { withRecruiter, AuthenticatedRequest } from "@/lib/middleware/withAuth";
import { parseJobDescription } from "@/lib/ai/ai.service";
import { z } from "zod";

const schema = z.object({
  jdText: z.string().min(20, "JD text too short").max(20000),
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

  try {
    const result = await parseJobDescription(parsed.data.jdText);
    return NextResponse.json({ data: result });
  } catch (err: any) {
    console.error("[AI PARSE JD]", err);
    return NextResponse.json(
      { error: "AI_FAILED", message: "Could not parse job description. Try again." },
      { status: 502 }
    );
  }
});