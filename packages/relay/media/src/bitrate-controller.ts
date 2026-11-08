/**
 * H.264 / VP8 Video Encoding & Adaptive Bitrate Controller
 *
 * Dynamically adjusts video streaming resolution, target bitrates, and frame rates
 * in response to observed network round-trip time (RTT) and packet loss.
 *
 * Note for Octavia: Used by WebRTC screen stream senders.
 */

export type BitrateTier = "high" | "medium" | "low" | "minimal";

export interface NetworkQualityMetrics {
  rttMs: number;
  packetLossRatio: number; // 0.0 - 1.0 (e.g. 0.05 = 5% loss)
  availableBandwidthKbps?: number;
}

export interface AdaptiveBitrateProfile {
  tier: BitrateTier;
  resolution: {
    width: number;
    height: number;
  };
  targetBitrateKbps: number;
  targetFrameRate: number;
  scaleResolutionDownBy: number;
}

export class AdaptiveBitrateController {
  private currentProfile: AdaptiveBitrateProfile;

  constructor(initialTier: BitrateTier = "high") {
    this.currentProfile = this.getProfileForTier(initialTier);
  }

  public getCurrentProfile(): AdaptiveBitrateProfile {
    return { ...this.currentProfile };
  }

  public evaluateNetwork(
    metrics: NetworkQualityMetrics,
  ): AdaptiveBitrateProfile {
    const { rttMs, packetLossRatio } = metrics;

    let targetTier: BitrateTier = "high";

    if (packetLossRatio >= 0.12 || rttMs >= 350) {
      targetTier = "minimal";
    } else if (packetLossRatio >= 0.05 || rttMs >= 180) {
      targetTier = "low";
    } else if (packetLossRatio >= 0.02 || rttMs >= 80) {
      targetTier = "medium";
    } else {
      targetTier = "high";
    }

    this.currentProfile = this.getProfileForTier(targetTier);
    return this.currentProfile;
  }

  public async applyToSender(
    sender: RTCRtpSender,
    profile: AdaptiveBitrateProfile = this.currentProfile,
  ): Promise<boolean> {
    if (!sender.getParameters || !sender.setParameters) {
      return false;
    }

    try {
      const params = sender.getParameters();
      if (!params.encodings || params.encodings.length === 0) {
        params.encodings = [{}];
      }

      const enc = params.encodings[0];
      if (enc) {
        enc.maxBitrate = profile.targetBitrateKbps * 1000;
        enc.scaleResolutionDownBy = profile.scaleResolutionDownBy;
        enc.maxFramerate = profile.targetFrameRate;
      }

      await sender.setParameters(params);
      return true;
    } catch {
      return false;
    }
  }

  private getProfileForTier(tier: BitrateTier): AdaptiveBitrateProfile {
    switch (tier) {
      case "high":
        return {
          tier: "high",
          resolution: { width: 1920, height: 1080 },
          targetBitrateKbps: 4000,
          targetFrameRate: 30,
          scaleResolutionDownBy: 1.0,
        };
      case "medium":
        return {
          tier: "medium",
          resolution: { width: 1280, height: 720 },
          targetBitrateKbps: 2000,
          targetFrameRate: 30,
          scaleResolutionDownBy: 1.5,
        };
      case "low":
        return {
          tier: "low",
          resolution: { width: 960, height: 540 },
          targetBitrateKbps: 1000,
          targetFrameRate: 24,
          scaleResolutionDownBy: 2.0,
        };
      case "minimal":
        return {
          tier: "minimal",
          resolution: { width: 640, height: 360 },
          targetBitrateKbps: 400,
          targetFrameRate: 15,
          scaleResolutionDownBy: 3.0,
        };
    }
  }
}
