import type { SessionId } from "@paddy-systems/relay-protocol";
import { defaultSessionRegistry } from "../storage/session-store.js";
import { defaultAuditService } from "./audit.js";

export interface KillSwitchResult {
  success: boolean;
  sessionId: SessionId;
  reason: string;
  revokedAt: number;
}

export function triggerEmergencySessionKill(
  sessionId: SessionId,
  actor: string,
  reason: string,
): KillSwitchResult {
  const closed = defaultSessionRegistry.closeSession(sessionId);

  defaultAuditService.logEvent({
    sessionId,
    action: "KILL_SWITCH_ENGAGED",
    actor,
    details: { reason, closedSuccessfully: closed },
  });

  return {
    success: closed,
    sessionId,
    reason,
    revokedAt: Date.now(),
  };
}
