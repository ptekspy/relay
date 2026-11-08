import crypto from "node:crypto";

/**
 * Session Password & Temporary One-Time Passcode (OTP) Protection
 *
 * Adds optional 4-to-6 digit PIN protection to individual relay sessions.
 * Exceeding 5 incorrect attempts triggers an automatic 15-minute brute-force lockout.
 *
 * Note for Octavia: Used by the PIN challenge modal upon QR code scan.
 */

export interface SessionPinConfig {
  sessionId: string;
  pinHash: string;
  salt: string;
  failedAttempts: number;
  lockedUntil?: number;
}

export interface PinVerificationResult {
  success: boolean;
  locked: boolean;
  remainingAttempts: number;
  lockoutRemainingSeconds?: number;
  reason?: string;
}

export const MAX_PIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function hashPin(pin: string, salt: string): string {
  return crypto.createHash("sha256").update(`${salt}:${pin}`).digest("hex");
}

export class SessionPasscodeManager {
  private configs = new Map<string, SessionPinConfig>();

  public setSessionPin(sessionId: string, pin: string): void {
    if (!/^\d{4,6}$/.test(pin)) {
      throw new Error("PIN must be 4 to 6 digits");
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const pinHash = hashPin(pin, salt);

    this.configs.set(sessionId, {
      sessionId,
      pinHash,
      salt,
      failedAttempts: 0,
    });
  }

  public hasPin(sessionId: string): boolean {
    return this.configs.has(sessionId);
  }

  public verifyPin(
    sessionId: string,
    attemptedPin: string,
    now = Date.now(),
  ): PinVerificationResult {
    const config = this.configs.get(sessionId);
    if (!config) {
      return {
        success: true,
        locked: false,
        remainingAttempts: MAX_PIN_ATTEMPTS,
      };
    }

    // Check if session is currently locked
    if (config.lockedUntil && now < config.lockedUntil) {
      const remainingSec = Math.ceil((config.lockedUntil - now) / 1000);
      return {
        success: false,
        locked: true,
        remainingAttempts: 0,
        lockoutRemainingSeconds: remainingSec,
        reason: `Session is locked due to brute-force protection. Try again in ${remainingSec}s`,
      };
    }

    // If lock expired, reset attempts
    if (config.lockedUntil && now >= config.lockedUntil) {
      config.lockedUntil = undefined;
      config.failedAttempts = 0;
    }

    const computed = hashPin(attemptedPin, config.salt);
    if (computed === config.pinHash) {
      config.failedAttempts = 0;
      return {
        success: true,
        locked: false,
        remainingAttempts: MAX_PIN_ATTEMPTS,
      };
    }

    config.failedAttempts++;
    if (config.failedAttempts >= MAX_PIN_ATTEMPTS) {
      config.lockedUntil = now + LOCKOUT_DURATION_MS;
      return {
        success: false,
        locked: true,
        remainingAttempts: 0,
        lockoutRemainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
        reason:
          "Maximum incorrect PIN attempts reached. Session locked for 15 minutes.",
      };
    }

    return {
      success: false,
      locked: false,
      remainingAttempts: MAX_PIN_ATTEMPTS - config.failedAttempts,
      reason: `Incorrect PIN. ${MAX_PIN_ATTEMPTS - config.failedAttempts} attempts remaining.`,
    };
  }

  public resetLockout(sessionId: string): void {
    const config = this.configs.get(sessionId);
    if (config) {
      config.failedAttempts = 0;
      config.lockedUntil = undefined;
    }
  }
}
