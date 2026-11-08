export interface BatteryThrottleRecommendation {
  shouldThrottle: boolean;
  targetTelemetryHz: number;
  reason?: string;
}

export interface BatteryManagerLike {
  level: number;
  charging: boolean;
}

export function evaluateBatteryThrottle(
  battery: BatteryManagerLike,
): BatteryThrottleRecommendation {
  if (!battery.charging && battery.level < 0.2) {
    return {
      shouldThrottle: true,
      targetTelemetryHz: 10,
      reason:
        "Battery critical (< 20%) and not charging. Throttling telemetry to 10Hz.",
    };
  }

  if (!battery.charging && battery.level < 0.35) {
    return {
      shouldThrottle: true,
      targetTelemetryHz: 30,
      reason:
        "Battery low (< 35%) and not charging. Throttling telemetry to 30Hz.",
    };
  }

  return {
    shouldThrottle: false,
    targetTelemetryHz: 60,
  };
}
