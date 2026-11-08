import { describe, expect, it } from "vitest";
import { authClient, authUrl, ensureProductSubscription } from "./client";
import { AccountPage, AuthLayout, SignInPage, SignUpPage } from "./pages";
import {
  getProductSubscription,
  getSessionFromToken,
  getUserSubscriptions,
} from "./server";

describe("@paddy-systems/auth", () => {
  it("resolves authUrl properly", () => {
    expect(authUrl).toBeDefined();
    expect(typeof authUrl).toBe("string");
    expect(authUrl.length).toBeGreaterThan(0);
  });

  it("exports Better Auth client helpers", () => {
    expect(authClient).toBeDefined();
    expect(typeof ensureProductSubscription).toBe("function");
  });

  it("exports server-side session and subscription functions", () => {
    expect(typeof getSessionFromToken).toBe("function");
    expect(typeof getUserSubscriptions).toBe("function");
    expect(typeof getProductSubscription).toBe("function");
  });

  it("exports shared page components for all web apps", () => {
    expect(typeof SignInPage).toBe("function");
    expect(typeof SignUpPage).toBe("function");
    expect(typeof AccountPage).toBe("function");
    expect(typeof AuthLayout).toBe("function");
  });
});
