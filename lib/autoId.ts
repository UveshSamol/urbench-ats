import { prisma } from "@/lib/prisma";

export async function generateId(prefix: string): Promise<string> {
  const counterId = prefix.toLowerCase();

  // Upsert counter and increment atomically
  const counter = await prisma.counter.upsert({
    where: { id: counterId },
    update: { value: { increment: 1 } },
    create: { id: counterId, value: 1 },
  });

  return `${prefix}-${String(counter.value).padStart(4, "0")}`;
}