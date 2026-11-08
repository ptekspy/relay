import crypto from "node:crypto";

/**
 * Expired & Revoked Invitation Lifecycle Manager
 *
 * Manages invitation lifecycles: configurable durations (1h, 8h, 24h, 7d),
 * consumption tracking (single-use vs multi-use), and instant revocation.
 *
 * Note for Octavia: Used in the invitation security middleware.
 */

export type InviteDuration = "1h" | "8h" | "24h" | "7d";
export type InviteType = "single-use" | "multi-use";

export interface InviteRecord {
  id: string;
  token: string;
  sessionId: string;
  creatorId: string;
  inviteeEmail?: string;
  duration: InviteDuration;
  maxUses: number;
  useCount: number;
  createdAt: number;
  expiresAt: number;
  revoked: boolean;
  revokedAt?: number;
  revokedBy?: string;
}

export type InviteValidationStatus =
  | "active"
  | "expired"
  | "revoked"
  | "exhausted";

export interface InviteValidationResult {
  valid: boolean;
  status: InviteValidationStatus;
  reason?: string;
  invite?: InviteRecord;
}

const DURATION_MS_MAP: Record<InviteDuration, number> = {
  "1h": 3600 * 1000,
  "8h": 8 * 3600 * 1000,
  "24h": 24 * 3600 * 1000,
  "7d": 7 * 24 * 3600 * 1000,
};

export class InviteLifecycleManager {
  private invites = new Map<string, InviteRecord>();

  public createInvite(params: {
    sessionId: string;
    creatorId: string;
    inviteeEmail?: string;
    duration?: InviteDuration;
    type?: InviteType;
    maxUses?: number;
  }): InviteRecord {
    const id = `inv_${crypto.randomBytes(8).toString("hex")}`;
    const token = `tok_${crypto.randomBytes(16).toString("hex")}`;
    const duration = params.duration ?? "24h";
    const durationMs = DURATION_MS_MAP[duration] ?? DURATION_MS_MAP["24h"];
    const createdAt = Date.now();
    const expiresAt = createdAt + durationMs;

    const maxUses =
      params.type === "single-use"
        ? 1
        : params.maxUses !== undefined && params.maxUses > 0
          ? params.maxUses
          : Number.POSITIVE_INFINITY;

    const record: InviteRecord = {
      id,
      token,
      sessionId: params.sessionId,
      creatorId: params.creatorId,
      inviteeEmail: params.inviteeEmail,
      duration,
      maxUses,
      useCount: 0,
      createdAt,
      expiresAt,
      revoked: false,
    };

    this.invites.set(id, record);
    this.invites.set(token, record);
    return record;
  }

  public validateAndConsume(
    idOrToken: string,
    now = Date.now(),
  ): InviteValidationResult {
    const invite = this.invites.get(idOrToken);
    if (!invite) {
      return {
        valid: false,
        status: "revoked",
        reason: "Invitation not found or revoked",
      };
    }

    if (invite.revoked) {
      return {
        valid: false,
        status: "revoked",
        reason: `Invitation was revoked by ${invite.revokedBy ?? "admin"}`,
        invite,
      };
    }

    if (now >= invite.expiresAt) {
      return {
        valid: false,
        status: "expired",
        reason: "Invitation has expired",
        invite,
      };
    }

    if (invite.useCount >= invite.maxUses) {
      return {
        valid: false,
        status: "exhausted",
        reason: "Single-use invitation has already been consumed",
        invite,
      };
    }

    invite.useCount += 1;
    return {
      valid: true,
      status: "active",
      invite,
    };
  }

  public revokeInvite(idOrToken: string, revokedBy: string): boolean {
    const invite = this.invites.get(idOrToken);
    if (!invite) return false;

    invite.revoked = true;
    invite.revokedAt = Date.now();
    invite.revokedBy = revokedBy;
    return true;
  }

  public getActiveInvitesForSession(
    sessionId: string,
    now = Date.now(),
  ): InviteRecord[] {
    const active: InviteRecord[] = [];
    const seen = new Set<string>();

    for (const invite of this.invites.values()) {
      if (
        invite.sessionId === sessionId &&
        !invite.revoked &&
        now < invite.expiresAt &&
        invite.useCount < invite.maxUses &&
        !seen.has(invite.id)
      ) {
        seen.add(invite.id);
        active.push(invite);
      }
    }

    return active;
  }
}
