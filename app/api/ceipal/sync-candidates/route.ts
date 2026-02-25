import { NextResponse } from "next/server";
import { withAdmin, AuthenticatedRequest } from "@/lib/middleware/withAuth";
import { syncCandidatesFromCeipal } from "@/lib/integrations/ceipal/ceipal.service";

export const POST = withAdmin(async (req: AuthenticatedRequest) => {
  const body = await req.json().catch(() => ({}));
  try {
    const result = await syncCandidatesFromCeipal({
      page: body.page || 1,
      limit: body.limit || 50,
      updatedAfter: body.updatedAfter ? new Date(body.updatedAfter) : undefined,
    });
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
});