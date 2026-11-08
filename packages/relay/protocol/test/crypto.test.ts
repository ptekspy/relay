import { describe, expect, it } from "bun:test";
import {
  computeHmac,
  generateSessionToken,
  generateShortCode,
  verifyHmac,
  verifyTimingSafeToken,
} from "../src/crypto.js";

describe("Cryptographic Token Utilities", () => {
  it("generates 64-character hex session tokens", () => {
    const t1 = generateSessionToken();
    const t2 = generateSessionToken();
    expect(t1.length).toBe(64);
    expect(t2.length).toBe(64);
    expect(t1).not.toBe(t2);
  });

  it("generates unambiguous 6-character short codes", () => {
    const code = generateShortCode();
    expect(code.length).toBe(6);
    // Ensure no ambiguous characters
    expect(code).not.toMatch(/[0O1IL]/);
  });

  it("performs constant-time token comparison", () => {
    const token = generateSessionToken();
    expect(verifyTimingSafeToken(token, token)).toBe(true);
    expect(verifyTimingSafeToken(token, generateSessionToken())).toBe(false);
    expect(verifyTimingSafeToken(token, "short")).toBe(false);
  });

  it("signs and verifies HMAC signatures", () => {
    const secret = "relay-secret-key-12345";
    const payload = JSON.stringify({ sessionId: "ses_123", role: "host" });
    const signature = computeHmac(payload, secret);

    expect(verifyHmac(payload, secret, signature)).toBe(true);
    expect(verifyHmac(payload, "wrong-secret", signature)).toBe(false);
    expect(verifyHmac(`${payload}-tampered`, secret, signature)).toBe(false);
  });
});
