"use client";

import { createAuthClient } from "better-auth/react";

export const authUrl =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://auth.paddy.systems"
    : process.env.BETTER_AUTH_URL || "https://auth.paddy.systems";

export const authClient = createAuthClient({
  baseURL: authUrl,
  fetchOptions: {
    credentials: "include",
  },
});

export const { useSession, signIn, signUp, signOut } = authClient;

export async function ensureProductSubscription(
  product: "RELAY" | "MIRROR" | "WEARFOLIO" | "STRIDE",
): Promise<boolean> {
  try {
    const res = await fetch(`${authUrl}/api/subscriptions/ensure`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ product }),
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to ensure product subscription:", err);
    return false;
  }
}
