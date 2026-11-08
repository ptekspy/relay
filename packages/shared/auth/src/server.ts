import {
  ensureFreeProductSubscription,
  getUserProductSubscriptions,
  type ProductId,
  prisma,
  type Subscription,
} from "@paddy-systems/database";

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSession {
  user: SessionUser;
  session: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
}

export async function getSessionFromToken(
  token: string,
): Promise<UserSession | null> {
  const sessionRecord = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!sessionRecord || sessionRecord.expiresAt < new Date()) {
    return null;
  }

  return {
    user: {
      id: sessionRecord.user.id,
      email: sessionRecord.user.email,
      name: sessionRecord.user.name,
      image: sessionRecord.user.image,
      emailVerified: sessionRecord.user.emailVerified,
      createdAt: sessionRecord.user.createdAt,
      updatedAt: sessionRecord.user.updatedAt,
    },
    session: {
      id: sessionRecord.id,
      userId: sessionRecord.userId,
      token: sessionRecord.token,
      expiresAt: sessionRecord.expiresAt,
      ipAddress: sessionRecord.ipAddress,
      userAgent: sessionRecord.userAgent,
    },
  };
}

export async function getUserSubscriptions(
  userId: string,
): Promise<Subscription[]> {
  return getUserProductSubscriptions(userId);
}

export async function getProductSubscription(
  userId: string,
  product: ProductId,
): Promise<Subscription> {
  return ensureFreeProductSubscription(userId, product);
}

export { ensureFreeProductSubscription };
