import { describe, expect, it } from "bun:test";
import { InviteManager } from "../lib/invite";

describe("TASK-162: Branded Invitation Landing Page with Fast QR & Short Code Handshake", () => {
  it("encodes and decodes valid invite tokens", () => {
    const expiresAt = Date.now() + 3600 * 1000;
    const token = InviteManager.generateToken({
      sessionId: "sess-prod-999",
      shortCode: "DEV-789",
      inviter: "Octavia",
      sessionName: "E-Commerce Checkout Revamp",
      expiresAt,
    });

    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);

    const decoded = InviteManager.decodeToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.sessionId).toBe("sess-prod-999");
    expect(decoded?.shortCode).toBe("DEV-789");
    expect(decoded?.inviter).toBe("Octavia");
    expect(decoded?.sessionName).toBe("E-Commerce Checkout Revamp");
  });

  it("handles remaining time formatting and expiration lifecycle", () => {
    const futureTime = Date.now() + 2.5 * 3600 * 1000;
    expect(InviteManager.isExpired(futureTime)).toBe(false);
    expect(InviteManager.formatRemainingTime(futureTime)).toBe("2h 30m");

    const pastTime = Date.now() - 60000;
    expect(InviteManager.isExpired(pastTime)).toBe(true);
    expect(InviteManager.formatRemainingTime(pastTime)).toBe("Expired");
  });

  it("safely handles corrupted or invalid tokens", () => {
    expect(InviteManager.decodeToken("invalid-base64-???")).toBeNull();
    expect(InviteManager.decodeToken("e30=")).toBeNull(); // Empty JSON object {}
  });
});
