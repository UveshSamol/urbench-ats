import { prisma } from "@/lib/prisma";
import { NotificationType, Role } from "@prisma/client";

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  await prisma.notification.create({
    data: { userId, type, title, message, link: link || null },
  });
}

export async function notifyManagers({
  type,
  title,
  message,
  link,
}: {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  // Find all recruiting managers and admins
  const managers = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: [Role.ADMIN, Role.RECRUITING_MANAGER] },
    },
    select: { id: true },
  });

  await Promise.all(
    managers.map(m =>
      createNotification({ userId: m.id, type, title, message, link })
    )
  );
}

export async function notifySalesManagers({
  type,
  title,
  message,
  link,
}: {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  const salesManagers = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: [Role.ADMIN, Role.SALES_MANAGER] },
    },
    select: { id: true },
  });

  await Promise.all(
    salesManagers.map(m =>
      createNotification({ userId: m.id, type, title, message, link })
    )
  );
}