import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, JWTPayload } from "@/lib/auth/auth.service";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface AuthenticatedRequest extends NextRequest {
  user: JWTPayload;
}

type RouteHandler = (
  req: AuthenticatedRequest,
  context?: any
) => Promise<NextResponse>;

interface AuthOptions {
  roles?: Role[];
  allowAdminOverride?: boolean;
}

export function withAuth(handler: RouteHandler, options: AuthOptions = {}) {
  return async (
    req: NextRequest,
    context?: any
  ): Promise<NextResponse> => {
    try {
      const authHeader = req.headers.get("authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return unauthorized("Missing or malformed Authorization header");
      }

      const token = authHeader.split(" ")[1];

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

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, isActive: true, role: true },
      });

      if (!user || !user.isActive) {
        return unauthorized("User account not found or deactivated");
      }

      if (options.roles && options.roles.length > 0) {
        if (!options.roles.includes(payload.role)) {
          return forbidden(
            `This endpoint requires role: ${options.roles.join(" or ")}. Your role: ${payload.role}`
          );
        }
      }

      (req as AuthenticatedRequest).user = payload;

      return handler(req as AuthenticatedRequest, context);

    } catch (err) {
      console.error("[AUTH MIDDLEWARE ERROR]", err);
      return NextResponse.json(
        { error: "INTERNAL_SERVER_ERROR" },
        { status: 500 }
      );
    }
  };
}

export function buildRecruiterFilter(user: JWTPayload): { recruiterId?: string } {
  if (user.role === Role.ADMIN) return {};
  return { recruiterId: user.userId };
}

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

export const withAnyRole = (handler: RouteHandler) => withAuth(handler);
export const withAdmin = (handler: RouteHandler) => withAuth(handler, { roles: [Role.ADMIN] });
export const withSales = (handler: RouteHandler) => withAuth(handler, { roles: [Role.ADMIN, Role.SALES] });
export const withRecruiter = (handler: RouteHandler) => withAuth(handler, { roles: [Role.ADMIN, Role.RECRUITER] });