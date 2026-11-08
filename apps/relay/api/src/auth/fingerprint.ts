import crypto from "node:crypto";

export interface DeviceTelemetry {
  ip: string;
  userAgent: string;
  acceptLanguage?: string;
  screenResolution?: string;
  devicePixelRatio?: number;
}

export interface FingerprintResult {
  fingerprint: string;
  trustScore: number; // 0 to 100
  isSuspicious: boolean;
  factors: string[];
}

export function computeDeviceFingerprint(
  telemetry: DeviceTelemetry,
): FingerprintResult {
  const hash = crypto
    .createHash("sha256")
    .update(
      `${telemetry.ip}|${telemetry.userAgent}|${telemetry.acceptLanguage ?? ""}|${telemetry.screenResolution ?? ""}`,
    )
    .digest("hex")
    .slice(0, 32);

  let score = 100;
  const factors: string[] = [];

  // Check 1: User Agent missing or curl/bot
  const ua = telemetry.userAgent.toLowerCase();
  if (!ua || ua.length < 10) {
    score -= 50;
    factors.push("Missing or abnormally short user-agent");
  } else if (
    ua.includes("curl") ||
    ua.includes("python-requests") ||
    ua.includes("go-http-client")
  ) {
    score -= 40;
    factors.push("Automated script or bot client");
  }

  // Check 2: Missing accept-language in browser context
  if (!telemetry.acceptLanguage && ua.includes("mozilla")) {
    score -= 15;
    factors.push("Missing Accept-Language header in browser agent");
  }

  // Check 3: Abnormal resolution
  if (telemetry.screenResolution && telemetry.screenResolution === "0x0") {
    score -= 30;
    factors.push("Invalid screen resolution 0x0");
  }

  const finalScore = Math.max(0, Math.min(100, score));

  return {
    fingerprint: `dfp_${hash}`,
    trustScore: finalScore,
    isSuspicious: finalScore < 50,
    factors,
  };
}
