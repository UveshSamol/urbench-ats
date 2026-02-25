import { NextRequest, NextResponse } from "next/server";
import { logoutUser, verifyAccessToken } from "@/lib/auth/auth.service";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const refreshToken = req.cookies.get("refresh_token")?.value;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const payload = verifyAccessToken(token);
        if (refreshToken) {
          await logoutUser(payload.userId, refreshToken);
        }
      } catch {
        // Token already expired — still clear cookie
      }
    }

    const response = NextResponse.json({ message: "Logged out successfully" });
    response.cookies.delete("refresh_token");
    return response;
  } catch (err) {
    console.error("[LOGOUT]", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}