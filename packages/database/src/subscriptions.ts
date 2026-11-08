import type { ProductId, Subscription } from "@prisma/client";
import { prisma } from "./client.js";

export async function ensureFreeProductSubscription(
  userId: string,
  product: ProductId,
): Promise<Subscription> {
  const existing = await prisma.subscription.findUnique({
    where: {
      userId_product: {
        userId,
        product,
      },
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.subscription.create({
    data: {
      userId,
      product,
      tier: "FREE",
      status: "ACTIVE",
      isLocalOnly: true,
    },
  });
}

export async function getUserProductSubscriptions(
  userId: string,
): Promise<Subscription[]> {
  return prisma.subscription.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}
