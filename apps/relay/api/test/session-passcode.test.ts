import { describe, expect, it } from "bun:test";
import {
  LOCKOUT_DURATION_MS,
  MAX_PIN_ATTEMPTS,
  SessionPasscodeManager,
} from "../src/auth/session-passcode.js";

describe("TASK-169: Session Password & Temporary One-Time Passcode (OTP) Protection", () => {
  it("validates PIN length and digits constraint", () => {
    const manager = new SessionPasscodeManager();
    expect(() => manager.setSessionPin("sess-1", "12")).toThrow();
    expect(() => manager.setSessionPin("sess-1", "1234567")).toThrow();
    expect(() => manager.setSessionPin("sess-1", "abcd")).toThrow();

    manager.setSessionPin("sess-1", "482910");
    expect(manager.hasPin("sess-1")).toBe(true);
  });

  it("verifies matching PIN and resets attempts count", () => {
    const manager = new SessionPasscodeManager();
    manager.setSessionPin("sess-2", "9876");

    const fail = manager.verifyPin("sess-2", "1111");
    expect(fail.success).toBe(false);
    expect(fail.remainingAttempts).toBe(4);

    const success = manager.verifyPin("sess-2", "9876");
    expect(success.success).toBe(true);
    expect(success.remainingAttempts).toBe(MAX_PIN_ATTEMPTS);
  });

  it("locks session for 15 minutes after 5 consecutive incorrect attempts", () => {
    const manager = new SessionPasscodeManager();
    manager.setSessionPin("sess-3", "5555");
    const startTime = Date.now();

    for (let i = 1; i <= 4; i++) {
      const res = manager.verifyPin("sess-3", "0000", startTime);
      expect(res.success).toBe(false);
      expect(res.locked).toBe(false);
      expect(res.remainingAttempts).toBe(MAX_PIN_ATTEMPTS - i);
    }

    // 5th attempt locks session
    const lockedRes = manager.verifyPin("sess-3", "0000", startTime);
    expect(lockedRes.success).toBe(false);
    expect(lockedRes.locked).toBe(true);
    expect(lockedRes.remainingAttempts).toBe(0);
    expect(lockedRes.lockoutRemainingSeconds).toBe(15 * 60);

    // Even with correct PIN, verification fails during lockout
    const attemptDuringLock = manager.verifyPin(
      "sess-3",
      "5555",
      startTime + 60000,
    );
    expect(attemptDuringLock.success).toBe(false);
    expect(attemptDuringLock.locked).toBe(true);
    expect(attemptDuringLock.reason).toContain("Try again in");

    // After 15 minutes have passed, lock expires and correct PIN works
    const afterLockoutTime = startTime + LOCKOUT_DURATION_MS + 1000;
    const unlockedRes = manager.verifyPin("sess-3", "5555", afterLockoutTime);
    expect(unlockedRes.success).toBe(true);
    expect(unlockedRes.locked).toBe(false);
  });
});
