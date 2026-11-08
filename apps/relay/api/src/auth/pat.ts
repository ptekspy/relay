import crypto from "node:crypto";
import type { RelayPermission } from "./rbac.js";

export interface PersonalAccessToken {
  id: string;
  name: string;
  userId: string;
  teamId: string;
  tokenHash: string;
  tokenPrefix: string;
  permissions: RelayPermission[];
  createdAt: number;
  lastUsedAt?: number;
  revokedAt?: number;
}

export class PersonalAccessTokenService {
  private tokens = new Map<string, PersonalAccessToken>(); // tokenHash -> PAT

  public static hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  public createToken(params: {
    name: string;
    userId: string;
    teamId: string;
    permissions: RelayPermission[];
  }): { token: string; record: PersonalAccessToken } {
    const rawSecret = crypto.randomBytes(32).toString("hex");
    const token = `pst_live_${rawSecret}`;
    const tokenHash = PersonalAccessTokenService.hashToken(token);
    const tokenPrefix = token.slice(0, 14); // e.g. "pst_live_a1b2c"

    const record: PersonalAccessToken = {
      id: `pat_${crypto.randomBytes(8).toString("hex")}`,
      name: params.name,
      userId: params.userId,
      teamId: params.teamId,
      tokenHash,
      tokenPrefix,
      permissions: params.permissions,
      createdAt: Date.now(),
    };

    this.tokens.set(tokenHash, record);
    return { token, record };
  }

  public verifyToken(token: string): PersonalAccessToken | null {
    if (!token.startsWith("pst_live_")) return null;
    const hash = PersonalAccessTokenService.hashToken(token);
    const pat = this.tokens.get(hash);

    if (!pat || pat.revokedAt) return null;

    pat.lastUsedAt = Date.now();
    return pat;
  }

  public revokeToken(id: string): boolean {
    for (const pat of this.tokens.values()) {
      if (pat.id === id) {
        pat.revokedAt = Date.now();
        return true;
      }
    }
    return false;
  }
}

export const defaultPatService = new PersonalAccessTokenService();
