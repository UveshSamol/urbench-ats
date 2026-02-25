import { NextResponse } from "next/server";
import { withRecruiter, AuthenticatedRequest } from "@/lib/middleware/withAuth";
import { parseResume } from "@/lib/ai/ai.service";
import { z } from "zod";

const schema = z.object({
  resumeText: z.string().min(50, "Resume text too short").max(50000),
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
    const result = await parseResume(parsed.data.resumeText);
    return NextResponse.json({ data: result });
  } catch (err: any) {
    console.error("[AI PARSE RESUME]", err);
    return NextResponse.json(
      { error: "AI_FAILED", message: "Could not parse resume. Try again." },
      { status: 502 }
    );
  }
});