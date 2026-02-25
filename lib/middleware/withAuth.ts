// ─────────────────────────────────────────────────────────────
// lib/middleware/withAuth.ts
// Role-based route protection middleware for Next.js App Router
// Usage: wrap any API route handler with withAuth()
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, JWTPayload } from "@/lib/auth/auth.service";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ─── EXTENDED REQUEST TYPE ────────────────────────────────────

export interface AuthenticatedRequest extends NextRequest {
  user: JWTPayload;
}

// ─── MIDDLEWARE FACTORY ───────────────────────────────────────

type RouteHandler = (
  req: AuthenticatedRequest,
  context?: any
) => Promise<NextResponse>;

interface AuthOptions {
  roles?: Role[];                  // allowed roles (empty = any authenticated user)
  ownerField?: string;             // field name on resource that must match userId
  allowAdminOverride?: boolean;    // admin bypasses owner check (default: true)
}

export function withAuth(handler: RouteHandler, options: AuthOptions = {}) {
  return async (
    req: NextRequest,
    context: { params: Record<string, string> }
  ): Promise<NextResponse> => {
    try {
      // ── 1. Extract token ──────────────────────────────────
      const authHeader = req.headers.get("authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return unauthorized("Missing or malformed Authorization header");
      }

      const token = authHeader.split(" ")[1];

      // ── 2. Verify token ───────────────────────────────────
      let payload: JWTPayload;
      try {
        payload = verifyAccessToken(token);
      } catch (err: any) {
        if (err.message === "ACCESS_TOKEN_EXPIRED") {
          return NextResponse.json(
            { error: "TOKEN_EXPIRED", message: "Access token expired. Please refresh." },
            { status: 401 }
          );
        }
        return unauthorized("Invalid access token");
      }

      // ── 3. Verify user still exists & is active ───────────
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, isActive: true, role: true },
      });

      if (!user || !user.isActive) {
        return unauthorized("User account not found or deactivated");
      }

      // ── 4. Role-based access check ────────────────────────
      if (options.roles && options.roles.length > 0) {
        if (!options.roles.includes(payload.role)) {
          return forbidden(
            `This endpoint requires role: ${options.roles.join(" or ")}. Your role: ${payload.role}`
          );
        }
      }

      // ── 5. Attach user to request ─────────────────────────
      (req as AuthenticatedRequest).user = payload;

      // ── 6. Call actual handler ────────────────────────────
      return handler(req as AuthenticatedRequest, context);

    } catch (err) {
      console.error("[AUTH MIDDLEWARE ERROR]", err);
      return NextResponse.json(
        { error: "INTERNAL_SERVER_ERROR", message: "Authentication failed unexpectedly" },
        { status: 500 }
      );
    }
  };
}

// ─── RECRUITER SCOPE FILTER ───────────────────────────────────
// Use in service layer: Recruiters see only their own data.
// Admins see all.

export function buildRecruiterFilter(user: JWTPayload): { recruiterId?: string } {
  if (user.role === Role.ADMIN) return {};           // Admin sees all
  return { recruiterId: user.userId };              // Recruiter sees only own
}

// ─── RESPONSE HELPERS ─────────────────────────────────────────

function unauthorized(message: string) {
  return NextResponse.json(
    { error: "UNAUTHORIZED", message },
    { status: 401 }
  );
}

function forbidden(message: string) {
  return NextResponse.json(
    { error: "FORBIDDEN", message },
    { status: 403 }
  );
}

// ─── CONVENIENCE WRAPPERS ─────────────────────────────────────

/** Any authenticated user (any role) */
export const withAnyRole = (handler: RouteHandler) => withAuth(handler);

/** Admin only */
export const withAdmin = (handler: RouteHandler) =>
  withAuth(handler, { roles: [Role.ADMIN] });

/** Admin or Sales */
export const withSales = (handler: RouteHandler) =>
  withAuth(handler, { roles: [Role.ADMIN, Role.SALES] });

/** Admin or Recruiter */
export const withRecruiter = (handler: RouteHandler) =>
  withAuth(handler, { roles: [Role.ADMIN, Role.RECRUITER] });

// ─── USAGE EXAMPLE ────────────────────────────────────────────
/*
// app/api/candidates/route.ts

import { withRecruiter } from "@/lib/middleware/withAuth";

export const GET = withRecruiter(async (req, ctx) => {
  const filter = buildRecruiterFilter(req.user);
  const candidates = await prisma.candidate.findMany({ where: filter });
  return NextResponse.json({ candidates });
});
*/

