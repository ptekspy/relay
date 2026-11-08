import type { ChaosProfile, ChaosProfileName } from "./types.js";

const DEFAULT_PROFILES: Record<ChaosProfileName, ChaosProfile> = {
  none: {
    name: "none",
    packetLossRate: 0,
    minLatencyMs: 0,
    maxLatencyMs: 0,
    dropRate: 0,
  },
  subway: {
    name: "subway",
    packetLossRate: 0.15,
    minLatencyMs: 150,
    maxLatencyMs: 1200,
    dropRate: 0.05,
  },
  "crowded-wifi": {
    name: "crowded-wifi",
    packetLossRate: 0.08,
    minLatencyMs: 50,
    maxLatencyMs: 400,
    dropRate: 0.02,
  },
  elevator: {
    name: "elevator",
    packetLossRate: 0.4,
    minLatencyMs: 300,
    maxLatencyMs: 2500,
    dropRate: 0.25,
  },
};

export class NetworkChaosInjector {
  public static readonly PROFILES: Record<ChaosProfileName, ChaosProfile> =
    DEFAULT_PROFILES;
  private activeProfile: ChaosProfile = DEFAULT_PROFILES.none;

  public setProfile(name: ChaosProfileName): void {
    this.activeProfile = NetworkChaosInjector.PROFILES[name];
  }

  public getProfile(): ChaosProfile {
    return this.activeProfile;
  }

  public shouldDropPacket(randomFloat = Math.random()): boolean {
    return randomFloat < this.activeProfile.packetLossRate;
  }

  public calculateSimulatedLatency(randomFloat = Math.random()): number {
    const range =
      this.activeProfile.maxLatencyMs - this.activeProfile.minLatencyMs;
    return this.activeProfile.minLatencyMs + Math.round(range * randomFloat);
  }
}

export const networkChaosInjector = new NetworkChaosInjector();
