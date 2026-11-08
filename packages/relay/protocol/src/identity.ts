export type SessionId = string & { readonly __brand: unique symbol };
export type ConnectionId = string & { readonly __brand: unique symbol };
export type ReceiverId = string & { readonly __brand: unique symbol };

export function toSessionId(id: string): SessionId {
  if (!id || typeof id !== "string") {
    throw new Error("Invalid SessionId: must be a non-empty string");
  }
  return id as SessionId;
}

export function toConnectionId(id: string): ConnectionId {
  if (!id || typeof id !== "string") {
    throw new Error("Invalid ConnectionId: must be a non-empty string");
  }
  return id as ConnectionId;
}

export function toReceiverId(id: string): ReceiverId {
  if (!id || typeof id !== "string") {
    throw new Error("Invalid ReceiverId: must be a non-empty string");
  }
  return id as ReceiverId;
}

export type RelayHostType = "LOCAL" | "REMOTE";
export type SessionAccessPolicy = "OPEN" | "TEAM_ONLY";

export interface RelayReceiverMetadata {
  id: ReceiverId;
  userAgent: string;
  ip: string;
  connectedAt: number;
  lastActiveAt: number;
  device?: {
    model?: string;
    screen?: { width: number; height: number; dpr: number };
    os?: string;
  };
}

export interface RelaySessionMetadata {
  id: SessionId;
  shortCode: string;
  hostType: RelayHostType;
  accessPolicy: SessionAccessPolicy;
  createdAt: number;
  targetPort: number;
  gatewayPort: number;
  activeConnectionsCount: number;
  teamId?: string;
}
