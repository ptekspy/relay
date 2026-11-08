import { describe, expect, it } from "bun:test";
import { verifyTimingSafeToken } from "../../packages/relay/protocol/src/crypto.js";

describe("Relay Security: Timing Attack Defense (TASK-P35)", () => {
  it("verifyTimingSafeToken returns true for identical tokens", () => {
    const token = "ps_rel_secret_token_1234567890abcdef";
    expect(verifyTimingSafeToken(token, token)).toBe(true);
  });

  it("verifyTimingSafeToken returns false for mismatching tokens without early exit bias", () => {
    const realToken = "ps_rel_secret_token_1234567890abcdef";
    const mismatchEarly = "xs_rel_secret_token_1234567890abcdef";
    const mismatchLate = "ps_rel_secret_token_1234567890abcdeg";

    expect(verifyTimingSafeToken(realToken, mismatchEarly)).toBe(false);
    expect(verifyTimingSafeToken(realToken, mismatchLate)).toBe(false);
  });

  it("measures constant-time behavior across varying prefix matches", () => {
    const target = "A".repeat(64);
    const candidateMismatchEarly = `B${"A".repeat(63)}`;
    const candidateMismatchLate = `${"A".repeat(63)}B`;

    const iterations = 10_000;

    const startEarly = performance.now();
    for (let i = 0; i < iterations; i++) {
      verifyTimingSafeToken(target, candidateMismatchEarly);
    }
    const elapsedEarly = performance.now() - startEarly;

    const startLate = performance.now();
    for (let i = 0; i < iterations; i++) {
      verifyTimingSafeToken(target, candidateMismatchLate);
    }
    const elapsedLate = performance.now() - startLate;

    // Both should be in similar magnitude without massive orders-of-magnitude delta
    const deltaRatio =
      Math.abs(elapsedEarly - elapsedLate) /
      Math.max(elapsedEarly, elapsedLate);
    expect(deltaRatio).toBeLessThan(0.8); // No early return timing leak
  });
});
