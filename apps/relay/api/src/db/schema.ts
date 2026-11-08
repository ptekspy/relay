import type {
  ConnectionId,
  ReceiverId,
  SessionId,
} from "@paddy-systems/relay-protocol";

export type SessionStatus = "active" | "closed" | "expired";

export interface RelaySessionRecord {
  id: SessionId;
  shortCode: string;
  sessionToken: string;
  targetPort: number;
  targetHost: string;
  status: SessionStatus;
  metadata?: Record<string, string>;
  createdAt: number;
  lastHeartbeatAt: number;
  expiresAt: number;
}

export interface RelayConnectionRecord {
  id: ConnectionId;
  sessionId: SessionId;
  receiverId: ReceiverId;
  ip: string;
  userAgent?: string;
  connectedAt: number;
  disconnectedAt?: number;
}

export interface RelayAuditLogRecord {
  id: string;
  sessionId: SessionId;
  action: string;
  actor: string;
  details?: Record<string, unknown>;
  timestamp: number;
}

export type UserRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export interface RelayUserRecord {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: number;
  lastLoginAt?: number;
}

export interface RelayTeamRecord {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
}
