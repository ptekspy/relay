import {
  generateSessionToken,
  generateShortCode,
  type SessionId,
  toSessionId,
} from "@paddy-systems/relay-protocol";
import type {
  RelayConnectionRecord,
  RelaySessionRecord,
} from "../db/schema.js";

export interface CreateSessionOptions {
  targetPort: number;
  targetHost?: string;
  ttlSeconds?: number;
  metadata?: Record<string, string>;
}

export class SessionRegistry {
  private sessions = new Map<SessionId, RelaySessionRecord>();
  private shortCodeIndex = new Map<string, SessionId>();
  private connections = new Map<string, RelayConnectionRecord>();

  public createSession(options: CreateSessionOptions): RelaySessionRecord {
    const id = toSessionId(
      `ses_${Math.random().toString(36).substring(2, 10)}`,
    );
    const shortCode = generateShortCode();
    const token = generateSessionToken();
    const now = Date.now();
    const ttlMs = (options.ttlSeconds ?? 3600) * 1000;

    const record: RelaySessionRecord = {
      id,
      shortCode,
      sessionToken: token,
      targetPort: options.targetPort,
      targetHost: options.targetHost ?? "127.0.0.1",
      status: "active",
      metadata: options.metadata,
      createdAt: now,
      lastHeartbeatAt: now,
      expiresAt: now + ttlMs,
    };

    this.sessions.set(id, record);
    this.shortCodeIndex.set(shortCode.toUpperCase(), id);
    return record;
  }

  public getSession(id: SessionId): RelaySessionRecord | undefined {
    const session = this.sessions.get(id);
    if (!session) return undefined;

    if (Date.now() > session.expiresAt) {
      session.status = "expired";
    }
    return session;
  }

  public getSessionByShortCode(code: string): RelaySessionRecord | undefined {
    const id = this.shortCodeIndex.get(code.toUpperCase());
    if (!id) return undefined;
    return this.getSession(id);
  }

  public registerConnection(record: RelayConnectionRecord): void {
    this.connections.set(record.id, record);
  }

  public getConnection(id: string): RelayConnectionRecord | undefined {
    return this.connections.get(id);
  }

  public updateHeartbeat(id: SessionId, ttlExtensionSeconds = 300): boolean {
    const session = this.getSession(id);
    if (session?.status !== "active") return false;

    session.lastHeartbeatAt = Date.now();
    session.expiresAt = Math.max(
      session.expiresAt,
      Date.now() + ttlExtensionSeconds * 1000,
    );
    return true;
  }

  public closeSession(id: SessionId): boolean {
    const session = this.sessions.get(id);
    if (!session) return false;

    session.status = "closed";
    this.shortCodeIndex.delete(session.shortCode.toUpperCase());
    return true;
  }

  public listActiveSessions(): RelaySessionRecord[] {
    const now = Date.now();
    const active: RelaySessionRecord[] = [];

    for (const session of this.sessions.values()) {
      if (session.status === "active" && session.expiresAt > now) {
        active.push(session);
      }
    }
    return active;
  }
}

export const defaultSessionRegistry = new SessionRegistry();
