import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const SAFE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // 30 characters, no 0/O/1/I/L

/**
 * Generates a 32-byte cryptographically secure session token (hex encoded, 64 chars).
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Generates an unambiguous 6-character short code.
 */
export function generateShortCode(length = 6): string {
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      code += SAFE_ALPHABET[byte % SAFE_ALPHABET.length];
    }
  }
  return code;
}

/**
 * Constant-time comparison to prevent timing side-channel attacks on tokens.
 */
export function verifyTimingSafeToken(
  provided: string,
  actual: string,
): boolean {
  if (typeof provided !== "string" || typeof actual !== "string") {
    return false;
  }

  const bufProvided = Buffer.from(provided);
  const bufActual = Buffer.from(actual);

  if (bufProvided.byteLength !== bufActual.byteLength) {
    return false;
  }

  return timingSafeEqual(bufProvided, bufActual);
}

/**
 * Computes an HMAC SHA-256 hex signature for message integrity verification.
 */
export function computeHmac(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("hex");
}

/**
 * Verifies an HMAC signature in constant time.
 */
export function verifyHmac(
  data: string,
  secret: string,
  signature: string,
): boolean {
  const expected = computeHmac(data, secret);
  return verifyTimingSafeToken(signature, expected);
}
