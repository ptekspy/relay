import crypto from "node:crypto";
import type { SessionId } from "@paddy-systems/relay-protocol";
import type { RelayAuditLogRecord } from "../db/schema.js";

export class AuditLogService {
  private logs: RelayAuditLogRecord[] = [];

  public logEvent(params: {
    sessionId: SessionId;
    action: string;
    actor: string;
    details?: Record<string, unknown>;
  }): RelayAuditLogRecord {
    const record: RelayAuditLogRecord = {
      id: `aud_${crypto.randomBytes(8).toString("hex")}`,
      sessionId: params.sessionId,
      action: params.action,
      actor: params.actor,
      details: params.details,
      timestamp: Date.now(),
    };

    this.logs.push(record);
    return record;
  }

  public getEventsForSession(sessionId: SessionId): RelayAuditLogRecord[] {
    return this.logs.filter((log) => log.sessionId === sessionId);
  }

  public getAllLogs(): readonly RelayAuditLogRecord[] {
    return this.logs;
  }
}

export const defaultAuditService = new AuditLogService();
