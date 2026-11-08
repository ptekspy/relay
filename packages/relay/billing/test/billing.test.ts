import { describe, expect, it } from "bun:test";
import {
  calculateCollisionProbability,
  checkQuotaEntitlement,
  generateShortCode,
  RELAY_PRODUCT_CATALOG,
  SecurityAuditEventSchema,
  validateRemoteTarget,
  validateShortCodeFormat,
} from "../src/index.js";

describe("Relay Billing: Product Catalog & Entitlements (TASK-P31, TASK-P32)", () => {
  it("defines catalog for free, solo, teams, enterprise", () => {
    expect(RELAY_PRODUCT_CATALOG.free).toBeDefined();
    expect(RELAY_PRODUCT_CATALOG.solo.prices.length).toBeGreaterThanOrEqual(3);
    expect(RELAY_PRODUCT_CATALOG.teams.minSeats).toBe(3);
  });

  it("denies remote tunnel feature for free tier", () => {
    const res = checkQuotaEntitlement({
      tier: "free",
      activeSessions: 0,
      requestedFeature: "remote_tunnel",
    });
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("Solo");
  });

  it("enforces session concurrency limits for solo tier", () => {
    const allowedRes = checkQuotaEntitlement({
      tier: "solo",
      activeSessions: 1,
      requestedFeature: "create_session",
    });
    expect(allowedRes.allowed).toBe(true);

    const blockedRes = checkQuotaEntitlement({
      tier: "solo",
      activeSessions: 2,
      requestedFeature: "create_session",
    });
    expect(blockedRes.allowed).toBe(false);
  });
});

describe("Relay Security: SSRF Protection (TASK-P33)", () => {
  it("blocks AWS metadata IP", () => {
    const res = validateRemoteTarget(
      "http://169.254.169.254/latest/meta-data/",
    );
    expect(res.allowed).toBe(false);
  });

  it("blocks localhost and loopback IPv4", () => {
    expect(validateRemoteTarget("localhost").allowed).toBe(false);
    expect(validateRemoteTarget("127.0.0.1").allowed).toBe(false);
    expect(validateRemoteTarget("127.0.1.1").allowed).toBe(false);
  });

  it("blocks private network subnets", () => {
    expect(validateRemoteTarget("10.0.1.25").allowed).toBe(false);
    expect(validateRemoteTarget("192.168.1.1").allowed).toBe(false);
    expect(validateRemoteTarget("172.20.0.5").allowed).toBe(false);
  });

  it("allows valid public addresses", () => {
    expect(validateRemoteTarget("https://api.paddy.systems").allowed).toBe(
      true,
    );
    expect(validateRemoteTarget("8.8.8.8").allowed).toBe(true);
  });
});

describe("Relay Security: Short-Code Entropy (TASK-P34)", () => {
  it("generates valid 6-character short codes", () => {
    const code = generateShortCode();
    expect(code.length).toBe(6);
    expect(validateShortCodeFormat(code)).toBe(true);
  });

  it("computes minimal collision probability under moderate load", () => {
    const p1k = calculateCollisionProbability(1000);
    expect(p1k).toBeLessThan(0.001); // < 0.1% for 1k concurrent codes
  });
});

describe("Relay Security: Audit Schema (TASK-P38)", () => {
  it("validates structured security audit payload", () => {
    const sample = {
      id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      type: "SHORT_CODE_BRUTE_FORCE_ATTEMPT",
      timestamp: new Date().toISOString(),
      actor: {
        ipAddress: "198.51.100.42",
        userAgent: "curl/7.68.0",
      },
      target: {
        sessionId: "sess_123",
      },
      details: {
        failedAttempts: 15,
        threshold: 10,
      },
      severity: "warning",
    };

    const parsed = SecurityAuditEventSchema.parse(sample);
    expect(parsed.type).toBe("SHORT_CODE_BRUTE_FORCE_ATTEMPT");
    expect(parsed.severity).toBe("warning");
  });
});
