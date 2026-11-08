import type { SubscriptionTier } from "./catalog.js";

export interface TierEntitlements {
  maxConcurrentSessions: number;
  maxSeats: number;
  allowRemoteTunnel: boolean;
  recordingRetentionDays: number;
  maxMonthlyBandwidthBytes: number;
  allowCustomSubdomain: boolean;
  allowSso: boolean;
}

export const TIER_ENTITLEMENTS: Record<SubscriptionTier, TierEntitlements> = {
  free: {
    maxConcurrentSessions: 1,
    maxSeats: 1,
    allowRemoteTunnel: false,
    recordingRetentionDays: 0,
    maxMonthlyBandwidthBytes: 0,
    allowCustomSubdomain: false,
    allowSso: false,
  },
  solo: {
    maxConcurrentSessions: 2,
    maxSeats: 1,
    allowRemoteTunnel: true,
    recordingRetentionDays: 7,
    maxMonthlyBandwidthBytes: 50 * 1024 * 1024 * 1024, // 50GB
    allowCustomSubdomain: true,
    allowSso: false,
  },
  teams: {
    maxConcurrentSessions: 10,
    maxSeats: 100,
    allowRemoteTunnel: true,
    recordingRetentionDays: 30,
    maxMonthlyBandwidthBytes: 500 * 1024 * 1024 * 1024, // 500GB
    allowCustomSubdomain: true,
    allowSso: false,
  },
  enterprise: {
    maxConcurrentSessions: 100,
    maxSeats: 1000,
    allowRemoteTunnel: true,
    recordingRetentionDays: 90,
    maxMonthlyBandwidthBytes: 5 * 1024 * 1024 * 1024 * 1024, // 5TB
    allowCustomSubdomain: true,
    allowSso: true,
  },
};

export interface QuotaCheckRequest {
  tier: SubscriptionTier;
  activeSessions: number;
  requestedFeature:
    | "remote_tunnel"
    | "create_session"
    | "custom_subdomain"
    | "sso"
    | "recording";
  currentBandwidthBytes?: number;
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  entitlements: TierEntitlements;
}

export function checkQuotaEntitlement(
  req: QuotaCheckRequest,
): QuotaCheckResult {
  const entitlements = TIER_ENTITLEMENTS[req.tier];

  switch (req.requestedFeature) {
    case "remote_tunnel":
      if (!entitlements.allowRemoteTunnel) {
        return {
          allowed: false,
          reason:
            "Remote edge tunneling is only available on Solo, Teams, and Enterprise tiers.",
          entitlements,
        };
      }
      break;

    case "create_session":
      if (req.activeSessions >= entitlements.maxConcurrentSessions) {
        return {
          allowed: false,
          reason: `Active sessions limit reached for tier ${req.tier} (${entitlements.maxConcurrentSessions} max).`,
          entitlements,
        };
      }
      break;

    case "custom_subdomain":
      if (!entitlements.allowCustomSubdomain) {
        return {
          allowed: false,
          reason: "Custom persistent subdomains require a paid subscription.",
          entitlements,
        };
      }
      break;

    case "sso":
      if (!entitlements.allowSso) {
        return {
          allowed: false,
          reason: "SAML 2.0 / SSO is an Enterprise-only feature.",
          entitlements,
        };
      }
      break;

    case "recording":
      if (entitlements.recordingRetentionDays <= 0) {
        return {
          allowed: false,
          reason: "Session recording storage is not enabled on the Free tier.",
          entitlements,
        };
      }
      break;
  }

  // Check bandwidth
  if (
    req.currentBandwidthBytes &&
    req.currentBandwidthBytes > entitlements.maxMonthlyBandwidthBytes
  ) {
    return {
      allowed: false,
      reason: "Monthly bandwidth quota exceeded.",
      entitlements,
    };
  }

  return { allowed: true, entitlements };
}
