import { verifyTimingSafeToken } from "@paddy-systems/relay-protocol";

export type ReceiverAccessPolicy = "OPEN" | "PASSCODE" | "TEAM_ONLY";

export interface PolicyValidationRequest {
  policy: ReceiverAccessPolicy;
  requiredPasscode?: string;
  providedPasscode?: string;
  sessionTeamId?: string;
  receiverTeamId?: string;
}

export interface PolicyValidationResult {
  allowed: boolean;
  reason?: string;
}

export function validateReceiverAccess(
  request: PolicyValidationRequest,
): PolicyValidationResult {
  switch (request.policy) {
    case "OPEN":
      return { allowed: true };

    case "PASSCODE":
      if (!request.requiredPasscode) {
        return { allowed: true };
      }
      if (!request.providedPasscode) {
        return {
          allowed: false,
          reason: "Passcode required to pair with this session",
        };
      }
      if (
        !verifyTimingSafeToken(
          request.providedPasscode,
          request.requiredPasscode,
        )
      ) {
        return { allowed: false, reason: "Invalid session passcode" };
      }
      return { allowed: true };

    case "TEAM_ONLY":
      if (!request.sessionTeamId || !request.receiverTeamId) {
        return {
          allowed: false,
          reason: "Authentication required: Team-only session",
        };
      }
      if (request.sessionTeamId !== request.receiverTeamId) {
        return {
          allowed: false,
          reason: "Access denied: Receiver is not in the host's team",
        };
      }
      return { allowed: true };

    default:
      return { allowed: false, reason: "Unknown access policy" };
  }
}
