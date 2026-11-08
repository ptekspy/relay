export interface TierQuotas {
  maxBandwidthBytes: number;
  maxRecordingHours: number;
  maxConcurrentSessions: number;
}

export const TIER_LIMITS: Record<string, TierQuotas> = {
  free: {
    maxBandwidthBytes: 1 * 1024 * 1024 * 1024, // 1 GB
    maxRecordingHours: 0,
    maxConcurrentSessions: 1,
  },
  solo: {
    maxBandwidthBytes: 50 * 1024 * 1024 * 1024, // 50 GB
    maxRecordingHours: 10,
    maxConcurrentSessions: 3,
  },
  teams: {
    maxBandwidthBytes: 500 * 1024 * 1024 * 1024, // 500 GB
    maxRecordingHours: 100,
    maxConcurrentSessions: 20,
  },
};

export interface UsageReport {
  bandwidthUsedBytes: number;
  recordingHoursUsed: number;
  bandwidthPercentage: number;
  status: "OK" | "WARNING_80" | "EXCEEDED_100";
  upgradeRecommended: boolean;
}

export class UsageMeter {
  public evaluateUsage(
    tier: string,
    currentBandwidthBytes: number,
    currentRecordingHours: number,
  ): UsageReport {
    const limits: TierQuotas = TIER_LIMITS[tier] ?? {
      maxBandwidthBytes: 1 * 1024 * 1024 * 1024,
      maxRecordingHours: 0,
      maxConcurrentSessions: 1,
    };
    const bandwidthPercentage =
      (currentBandwidthBytes / limits.maxBandwidthBytes) * 100;

    let status: UsageReport["status"] = "OK";
    if (
      bandwidthPercentage >= 100 ||
      (limits.maxRecordingHours > 0 &&
        currentRecordingHours >= limits.maxRecordingHours)
    ) {
      status = "EXCEEDED_100";
    } else if (
      bandwidthPercentage >= 80 ||
      (limits.maxRecordingHours > 0 &&
        currentRecordingHours >= limits.maxRecordingHours * 0.8)
    ) {
      status = "WARNING_80";
    }

    return {
      bandwidthUsedBytes: currentBandwidthBytes,
      recordingHoursUsed: currentRecordingHours,
      bandwidthPercentage: Math.round(bandwidthPercentage),
      status,
      upgradeRecommended: status !== "OK",
    };
  }
}
