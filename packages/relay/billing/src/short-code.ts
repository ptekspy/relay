export const SHORT_CODE_CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // 32 characters (unambiguous, no 0/O, 1/I)
export const SHORT_CODE_LENGTH = 6;
export const TOTAL_COMBINATIONS =
  SHORT_CODE_CHARSET.length ** SHORT_CODE_LENGTH; // 32^6 = 1,073,741,824

export function calculateCollisionProbability(activeSessions: number): number {
  if (activeSessions <= 1) return 0;
  // Birthday paradox approximation: P(collision) ≈ 1 - exp(-k(k-1) / (2 * N))
  const exponent =
    -(activeSessions * (activeSessions - 1)) / (2 * TOTAL_COMBINATIONS);
  return 1 - Math.exp(exponent);
}

export function generateShortCode(): string {
  const bytes = new Uint8Array(SHORT_CODE_LENGTH);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < SHORT_CODE_LENGTH; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  let code = "";
  for (let i = 0; i < SHORT_CODE_LENGTH; i++) {
    const byte = bytes[i] ?? 0;
    code += SHORT_CODE_CHARSET[byte % SHORT_CODE_CHARSET.length];
  }
  return code;
}

export function validateShortCodeFormat(code: string): boolean {
  if (code.length !== SHORT_CODE_LENGTH) return false;
  const upper = code.toUpperCase();
  for (const ch of upper) {
    if (!SHORT_CODE_CHARSET.includes(ch)) return false;
  }
  return true;
}
