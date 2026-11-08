import { describe, expect, it } from "bun:test";
import { toSessionId } from "@paddy-systems/relay-protocol";
import { validateReceiverAccess } from "../src/auth/access-policy.js";
import { AuditLogService } from "../src/auth/audit.js";
import { DeviceFlowManager } from "../src/auth/device-flow.js";
import {
  generateEd25519KeyPair,
  signPayloadEd25519,
  verifySignatureEd25519,
} from "../src/auth/ed25519.js";
import { computeDeviceFingerprint } from "../src/auth/fingerprint.js";
import { triggerEmergencySessionKill } from "../src/auth/kill-switch.js";
import { PersonalAccessTokenService } from "../src/auth/pat.js";
import { assertPermission, hasPermission } from "../src/auth/rbac.js";

describe("Identity & Authentication Platform (Epic 5)", () => {
  it("enforces RBAC permission hierarchy correctly", () => {
    expect(hasPermission("OWNER", "relay:admin")).toBe(true);
    expect(hasPermission("OWNER", "relay:kill")).toBe(true);
    expect(hasPermission("MEMBER", "relay:write")).toBe(true);
    expect(hasPermission("MEMBER", "relay:admin")).toBe(false);
    expect(hasPermission("VIEWER", "relay:read")).toBe(true);
    expect(hasPermission("VIEWER", "relay:write")).toBe(false);

    expect(() =>
      assertPermission(
        {
          userId: "usr_1",
          email: "viewer@ps.com",
          teamId: "team_1",
          role: "VIEWER",
        },
        "relay:write",
      ),
    ).toThrow();
  });

  it("handles RFC 8628 OAuth 2.0 Device Flow lifecycle", () => {
    const flow = new DeviceFlowManager();
    const initiated = flow.initiate("cli_client_1");

    expect(initiated.deviceCode.length).toBe(64);
    expect(initiated.userCode.length).toBe(9); // e.g. XXXX-XXXX
    expect(initiated.verificationUri).toContain("device");

    // Initially pending
    const initialPoll = flow.poll(initiated.deviceCode);
    expect(initialPoll.status).toBe("authorization_pending");

    // Immediate second poll triggers slow_down
    const fastPoll = flow.poll(initiated.deviceCode);
    expect(fastPoll.status).toBe("slow_down");

    // Authorize user
    const authorized = flow.authorize(initiated.userCode, "user_developer_123");
    expect(authorized).toBe(true);

    // Poll without rate limit returns token
    const tokenPoll = flow.poll(initiated.deviceCode, false);
    expect(tokenPoll.status).toBe("authorized");
    expect(tokenPoll.accessToken?.startsWith("pst_tok_")).toBe(true);
  });

  it("generates, hashes, verifies, and revokes PATs", () => {
    const patService = new PersonalAccessTokenService();
    const { token, record } = patService.createToken({
      name: "CI Runner",
      userId: "user_ci",
      teamId: "team_infra",
      permissions: ["relay:read", "relay:write"],
    });

    expect(token.startsWith("pst_live_")).toBe(true);
    expect(record.tokenHash).not.toBe(token); // Verified hashed

    // Successful verification
    const verified = patService.verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe(record.id);
    expect(verified?.lastUsedAt).toBeDefined();

    // Revocation
    expect(patService.revokeToken(record.id)).toBe(true);
    expect(patService.verifyToken(token)).toBeNull();
  });

  it("signs and verifies tokens with Ed25519 asymmetric cryptography", () => {
    const keyPair = generateEd25519KeyPair();
    const payload = JSON.stringify({
      sessionId: "ses_abc123",
      role: "host",
      ts: 1700000000,
    });

    const signature = signPayloadEd25519(payload, keyPair.privateKeyPem);
    expect(signature.length).toBeGreaterThan(32);

    const isValid = verifySignatureEd25519(
      payload,
      signature,
      keyPair.publicKeyPem,
    );
    expect(isValid).toBe(true);

    // Tampered payload fails
    const tamperedPayload = JSON.stringify({
      sessionId: "ses_abc123",
      role: "admin",
      ts: 1700000000,
    });
    const isTamperedValid = verifySignatureEd25519(
      tamperedPayload,
      signature,
      keyPair.publicKeyPem,
    );
    expect(isTamperedValid).toBe(false);
  });

  it("validates receiver access control policies (OPEN, PASSCODE, TEAM_ONLY)", () => {
    // OPEN
    expect(validateReceiverAccess({ policy: "OPEN" }).allowed).toBe(true);

    // PASSCODE
    expect(
      validateReceiverAccess({
        policy: "PASSCODE",
        requiredPasscode: "secret99",
        providedPasscode: "secret99",
      }).allowed,
    ).toBe(true);

    expect(
      validateReceiverAccess({
        policy: "PASSCODE",
        requiredPasscode: "secret99",
        providedPasscode: "wrongpass",
      }).allowed,
    ).toBe(false);

    // TEAM_ONLY
    expect(
      validateReceiverAccess({
        policy: "TEAM_ONLY",
        sessionTeamId: "team_eng",
        receiverTeamId: "team_eng",
      }).allowed,
    ).toBe(true);

    expect(
      validateReceiverAccess({
        policy: "TEAM_ONLY",
        sessionTeamId: "team_eng",
        receiverTeamId: "team_other",
      }).allowed,
    ).toBe(false);
  });

  it("computes device fingerprints and detects suspicious clients", () => {
    const normalBrowser = computeDeviceFingerprint({
      ip: "192.168.1.50",
      userAgent:
        "Mozilla/5.0 (Linux; Android 12; TB328FU) AppleWebKit/537.36 Chrome/120.0",
      acceptLanguage: "en-US,en;q=0.9",
      screenResolution: "1340x800",
    });

    expect(normalBrowser.trustScore).toBe(100);
    expect(normalBrowser.isSuspicious).toBe(false);
    expect(normalBrowser.fingerprint.startsWith("dfp_")).toBe(true);

    const botClient = computeDeviceFingerprint({
      ip: "10.0.0.99",
      userAgent: "curl/7.88.1",
    });

    expect(botClient.trustScore).toBeLessThanOrEqual(60);
    expect(botClient.factors).toContain("Automated script or bot client");
  });

  it("records immutable audit log events", () => {
    const auditService = new AuditLogService();
    const sessionId = toSessionId("ses_aud_test");

    auditService.logEvent({
      sessionId,
      action: "RECEIVER_PAIR_REQUEST",
      actor: "192.168.1.100",
      details: { userAgent: "Chrome" },
    });

    const events = auditService.getEventsForSession(sessionId);
    expect(events.length).toBe(1);
    expect(events[0]?.action).toBe("RECEIVER_PAIR_REQUEST");
  });

  it("engages emergency session kill switch", () => {
    const sessionId = toSessionId("ses_emergency_kill");
    const result = triggerEmergencySessionKill(
      sessionId,
      "admin_user",
      "Suspicious traffic spike",
    );

    expect(result.sessionId).toBe(sessionId);
    expect(result.reason).toBe("Suspicious traffic spike");
  });
});
