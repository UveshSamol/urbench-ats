import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware/withAuth";

// GET /api/notifications — get current user's notifications
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: req.user.userId, isRead: false },
  });

  return NextResponse.json({ data: notifications, unreadCount });
});

// POST /api/notifications/read-all — mark all as read
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.userId, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true });
});