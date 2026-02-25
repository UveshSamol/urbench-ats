import { NextRequest, NextResponse } from "next/server";
import { refreshAccessToken } from "@/lib/auth/auth.service";

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get("refresh_token")?.value;
    if (!refreshToken) {
      return NextResponse.json({ error: "NO_REFRESH_TOKEN" }, { status: 401 });
    }
    const { accessToken } = await refreshAccessToken(refreshToken);
    return NextResponse.json({ accessToken });
  } catch {
    return NextResponse.json({ error: "INVALID_REFRESH_TOKEN" }, { status: 401 });
  }
}