import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/lib/auth/auth.service";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password too short"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "VALIDATION_ERROR", issues: parsed.error.flatten() }, { status: 400 });
    }

    const result = await loginUser(parsed.data.email, parsed.data.password);

    const response = NextResponse.json({
      user: result.user,
      accessToken: result.tokens.accessToken,
      message: "Login successful",
    });

    response.cookies.set("refresh_token", result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/api/auth",
    });

    return response;
  } catch (err: any) {
    if (err.message === "INVALID_CREDENTIALS") {
      return NextResponse.json({ error: "INVALID_CREDENTIALS", message: "Wrong email or password" }, { status: 401 });
    }
    console.error("[LOGIN]", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}