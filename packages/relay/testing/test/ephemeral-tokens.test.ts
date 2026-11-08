import { describe, expect, it } from "bun:test";
import {
  EphemeralTokenManager,
  MAX_CI_TTL_SECONDS,
} from "../src/ephemeral-tokens.js";

describe("TASK-188: CI Tunnel Ephemeral Token Provisioning & Cleanup", () => {
  const manager = new EphemeralTokenManager();

  it("mints scoped tokens and caps TTL to 2-hour maximum", () => {
    // Attempt requesting 10-hour TTL
    const token = manager.mintToken({
      ciRunnerId: "runner-gh-actions-101",
      repository: "Paddy-Systems/p-s-core",
      prNumber: 42,
      ttlSeconds: 36000,
    });

    expect(token.tokenId).toStartWith("ci_tok_");
    expect(token.repository).toBe("Paddy-Systems/p-s-core");
    expect(token.prNumber).toBe(42);
    expect(token.isRevoked).toBe(false);

    // Hard ceiling check: expiresAt <= createdAt + 7200s
    const lifetimeSeconds = (token.expiresAt - token.createdAt) / 1000;
    expect(lifetimeSeconds).toBe(MAX_CI_TTL_SECONDS);
  });

  it("registers active tunnel sessions and cleans them up on token revocation", async () => {
    const token = manager.mintToken({
      ciRunnerId: "runner-cleanup-test",
      repository: "Paddy-Systems/p-s-core",
      ttlSeconds: 600,
    });

    manager.registerResource(token.tokenId, "sess_preview_1");
    manager.registerResource(token.tokenId, "sess_preview_2");

    expect(token.resourceIds).toEqual(["sess_preview_1", "sess_preview_2"]);

    // Verify token is initially valid
    const checkBefore = manager.validateToken(token.tokenId);
    expect(checkBefore.valid).toBe(true);

    // Revoke and cleanup
    const terminatedSessions: string[] = [];
    const cleanupResult = await manager.revokeAndCleanup(
      token.tokenId,
      async (sessId) => {
        terminatedSessions.push(sessId);
      },
    );

    expect(cleanupResult.cleanedSessions).toEqual([
      "sess_preview_1",
      "sess_preview_2",
    ]);
    expect(terminatedSessions).toEqual(["sess_preview_1", "sess_preview_2"]);

    // Verify token is now invalid and has zero lingering resources
    const checkAfter = manager.validateToken(token.tokenId);
    expect(checkAfter.valid).toBe(false);
    expect(checkAfter.reason).toBe("Token has been revoked");
    expect(token.resourceIds.length).toBe(0);
  });

  it("sweeps expired tokens and releases orphaned tunnels automatically", async () => {
    // Create token with negative/zero TTL to simulate immediate expiration
    const expiredToken = manager.mintToken({
      ciRunnerId: "runner-orphan-sweep",
      repository: "Paddy-Systems/p-s-core",
      ttlSeconds: 0,
    });

    // Artificially expire the token
    expiredToken.expiresAt = Date.now() - 5000;
    manager.registerResource(expiredToken.tokenId, "sess_orphaned_99");

    const sweptSessions: string[] = [];
    const sweep = await manager.sweepExpired(async (sessId) => {
      sweptSessions.push(sessId);
    });

    expect(sweep.revokedTokenCount).toBeGreaterThanOrEqual(1);
    expect(sweptSessions).toContain("sess_orphaned_99");
  });
});
