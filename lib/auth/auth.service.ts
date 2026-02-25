// ─────────────────────────────────────────────────────────────
// lib/auth/auth.service.ts
// JWT Authentication — server-side only, never exposed to client
// ─────────────────────────────────────────────────────────────

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

// ─── TYPES ────────────────────────────────────────────────────

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ─── CONSTANTS ────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const SALT_ROUNDS = 12;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error("JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables.");
}

// ─── PASSWORD UTILITIES ───────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── TOKEN GENERATION ─────────────────────────────────────────

export function generateAccessToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function generateRefreshToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

// ─── TOKEN VERIFICATION ───────────────────────────────────────

export function verifyAccessToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new Error("ACCESS_TOKEN_EXPIRED");
    }
    throw new Error("INVALID_ACCESS_TOKEN");
  }
}

export function verifyRefreshToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
  } catch {
    throw new Error("INVALID_REFRESH_TOKEN");
  }
}

// ─── LOGIN ────────────────────────────────────────────────────

export async function loginUser(
  email: string,
  password: string
): Promise<{ user: { id: string; name: string; email: string; role: Role }; tokens: AuthTokens }> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, name: true, email: true, role: true, passwordHash: true, isActive: true },
  });

  if (!user || !user.isActive) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);
  if (!passwordValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const payload: Omit<JWTPayload, "iat" | "exp"> = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store refresh token in DB (hashed)
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await prisma.refreshToken.create({
    data: {
      token: refreshTokenHash,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    tokens: { accessToken, refreshToken },
  };
}

// ─── REFRESH TOKENS ───────────────────────────────────────────

export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string }> {
  const payload = verifyRefreshToken(refreshToken);

  // Verify the refresh token exists in DB and is not revoked
  const storedTokens = await prisma.refreshToken.findMany({
    where: { userId: payload.userId, revoked: false, expiresAt: { gt: new Date() } },
  });

  // Check if any stored token matches (we hashed it on store)
  let tokenValid = false;
  for (const stored of storedTokens) {
    const matches = await bcrypt.compare(refreshToken, stored.token);
    if (matches) { tokenValid = true; break; }
  }

  if (!tokenValid) throw new Error("REFRESH_TOKEN_REVOKED");

  const newAccessToken = generateAccessToken({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  });

  return { accessToken: newAccessToken };
}

// ─── LOGOUT ───────────────────────────────────────────────────

export async function logoutUser(userId: string, refreshToken: string): Promise<void> {
  const storedTokens = await prisma.refreshToken.findMany({
    where: { userId, revoked: false },
  });

  for (const stored of storedTokens) {
    const matches = await bcrypt.compare(refreshToken, stored.token);
    if (matches) {
      await prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revoked: true },
      });
      break;
    }
  }
}

// ─── CREATE USER (Admin only) ─────────────────────────────────

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: Role;
}): Promise<{ id: string; name: string; email: string; role: Role }> {
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase().trim() },
  });

  if (existing) throw new Error("EMAIL_ALREADY_EXISTS");

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase().trim(),
      passwordHash,
      role: data.role,
    },
    select: { id: true, name: true, email: true, role: true },
  });

  return user;
}