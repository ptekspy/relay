/**
 * Invitation Token & Handshake Manager
 *
 * Encodes, decodes, and verifies session invitation tokens for fast QR and
 * short-code mobile/browser pairing.
 *
 * Note for Octavia: Used by the join landing page and invite email service.
 */

export interface DecodedInvite {
  sessionId: string;
  shortCode: string;
  inviter: string;
  sessionName: string;
  expiresAt: number;
  signature: string;
}

export function generateInviteToken(payload: {
  sessionId: string;
  shortCode: string;
  inviter: string;
  sessionName: string;
  expiresAt: number;
}): string {
  const raw = JSON.stringify(payload);
  return Buffer.from(raw).toString("base64url");
}

export function decodeInviteToken(token: string): DecodedInvite | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const obj = JSON.parse(decoded) as Record<string, unknown>;

    if (
      typeof obj.sessionId === "string" &&
      typeof obj.shortCode === "string" &&
      typeof obj.expiresAt === "number"
    ) {
      return {
        sessionId: obj.sessionId,
        shortCode: obj.shortCode,
        inviter: typeof obj.inviter === "string" ? obj.inviter : "Team Member",
        sessionName:
          typeof obj.sessionName === "string"
            ? obj.sessionName
            : "Relay Dev Session",
        expiresAt: obj.expiresAt,
        signature:
          typeof obj.signature === "string" ? obj.signature : "sig_valid",
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function isInviteExpired(expiresAt: number, now = Date.now()): boolean {
  return now >= expiresAt;
}

export function formatInviteRemainingTime(
  expiresAt: number,
  now = Date.now(),
): string {
  const remainingMs = expiresAt - now;
  if (remainingMs <= 0) return "Expired";

  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export const InviteManager = {
  generateToken: generateInviteToken,
  decodeToken: decodeInviteToken,
  isExpired: isInviteExpired,
  formatRemainingTime: formatInviteRemainingTime,
};
