import { describe, expect, it } from "bun:test";
import { AcmeTlsManager } from "../src/acme-tls";

describe("TASK-103: Automated Let's Encrypt / ACME Dynamic TLS Provisioning", () => {
  it("resolves exact and wildcard TLS certificates accurately", () => {
    const manager = new AcmeTlsManager();
    const now = new Date();
    const future = new Date(
      now.getTime() + 60 * 24 * 60 * 60 * 1000,
    ).toISOString();

    manager.registerCertificate({
      domain: "*.relay.paddy.systems",
      isWildcard: true,
      certPem: "---CERT---",
      keyPem: "---KEY---",
      fingerprintSha256: "sha256:abcd",
      issuedAt: now.toISOString(),
      expiresAt: future,
      status: "valid",
    });

    // Subdomain should match wildcard
    const wildcardMatch = manager.getCertificate(
      "session-999.relay.paddy.systems",
    );
    expect(wildcardMatch).not.toBeNull();
    expect(wildcardMatch?.domain).toBe("*.relay.paddy.systems");

    // Unrelated domain should return null
    expect(manager.getCertificate("custom.example.com")).toBeNull();
  });

  it("detects when certificates are due for renewal based on threshold", () => {
    const manager = new AcmeTlsManager({ renewalThresholdDays: 30 });
    const now = new Date();
    const expiringSoon = new Date(
      now.getTime() + 15 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const farFuture = new Date(
      now.getTime() + 90 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const cert1 = {
      domain: "soon.relay.zone",
      isWildcard: false,
      certPem: "...",
      keyPem: "...",
      fingerprintSha256: "1",
      issuedAt: now.toISOString(),
      expiresAt: expiringSoon,
      status: "valid" as const,
    };

    const cert2 = {
      domain: "fresh.relay.zone",
      isWildcard: false,
      certPem: "...",
      keyPem: "...",
      fingerprintSha256: "2",
      issuedAt: now.toISOString(),
      expiresAt: farFuture,
      status: "valid" as const,
    };

    expect(manager.isCertificateDueForRenewal(cert1, now)).toBe(true);
    expect(manager.isCertificateDueForRenewal(cert2, now)).toBe(false);
  });

  it("stores and serves ACME HTTP-01 challenge authorizations with TTL expiration", () => {
    const manager = new AcmeTlsManager();
    const now = new Date();
    const validExpiry = new Date(now.getTime() + 300_000).toISOString();
    const expiredExpiry = new Date(now.getTime() - 1_000).toISOString();

    manager.storeChallenge({
      token: "token-active-123",
      keyAuthorization: "token-active-123.auth-key-hash",
      domain: "myteam.relay.zone",
      expiresAt: validExpiry,
    });

    manager.storeChallenge({
      token: "token-expired-456",
      keyAuthorization: "token-expired-456.auth-key-hash",
      domain: "myteam.relay.zone",
      expiresAt: expiredExpiry,
    });

    manager.storeChallenge({
      token: "token-to-purge-789",
      keyAuthorization: "token-to-purge-789.auth-key-hash",
      domain: "myteam.relay.zone",
      expiresAt: expiredExpiry,
    });

    expect(manager.getChallenge("token-active-123", now)).toBe(
      "token-active-123.auth-key-hash",
    );
    expect(manager.getChallenge("token-expired-456", now)).toBeNull();

    const purged = manager.cleanupExpiredChallenges(now);
    expect(purged).toBe(1);
  });

  it("exports modern secure cipher suite configuration", () => {
    const manager = new AcmeTlsManager();
    const profile = manager.getTlsSecurityProfile();
    expect(profile.minVersion).toBe("TLSv1.2");
    expect(profile.ciphers).toContain("TLS_AES_128_GCM_SHA256");
    expect(profile.hstsMaxAge).toBe(31536000);
  });
});
