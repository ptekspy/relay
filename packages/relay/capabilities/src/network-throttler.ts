/**
 * Remote Network Throttling Simulation
 *
 * Intercepts fetch and network requests on receivers to simulate real-world mobile network conditions:
 * Offline, Slow 2G, Fast 2G, Slow 3G, Fast 3G, 4G, and custom RTT / packet jitter.
 *
 * Note for Octavia: This powers the network throttling drawer in the Cloud Web dashboard.
 */

export interface NetworkProfileConfig {
  name: string;
  downloadKbps: number;
  uploadKbps: number;
  latencyMs: number;
  jitterMs: number;
  offline?: boolean;
}

export type NetworkProfileName =
  | "online"
  | "offline"
  | "slow-2g"
  | "fast-2g"
  | "slow-3g"
  | "fast-3g"
  | "regular-4g";

export const NETWORK_PROFILES: Record<
  NetworkProfileName,
  NetworkProfileConfig
> = {
  online: {
    name: "Online (No throttling)",
    downloadKbps: Number.POSITIVE_INFINITY,
    uploadKbps: Number.POSITIVE_INFINITY,
    latencyMs: 0,
    jitterMs: 0,
    offline: false,
  },
  offline: {
    name: "Offline",
    downloadKbps: 0,
    uploadKbps: 0,
    latencyMs: 0,
    jitterMs: 0,
    offline: true,
  },
  "slow-2g": {
    name: "Slow 2G",
    downloadKbps: 100,
    uploadKbps: 50,
    latencyMs: 800,
    jitterMs: 80,
    offline: false,
  },
  "fast-2g": {
    name: "Fast 2G",
    downloadKbps: 250,
    uploadKbps: 100,
    latencyMs: 400,
    jitterMs: 50,
    offline: false,
  },
  "slow-3g": {
    name: "Slow 3G",
    downloadKbps: 400,
    uploadKbps: 400,
    latencyMs: 400,
    jitterMs: 20,
    offline: false,
  },
  "fast-3g": {
    name: "Fast 3G",
    downloadKbps: 1600,
    uploadKbps: 750,
    latencyMs: 150,
    jitterMs: 15,
    offline: false,
  },
  "regular-4g": {
    name: "Regular 4G / LTE",
    downloadKbps: 8000,
    uploadKbps: 4000,
    latencyMs: 50,
    jitterMs: 5,
    offline: false,
  },
};

export type FetchFunction = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export class NetworkThrottlerController {
  private currentProfile: NetworkProfileConfig = { ...NETWORK_PROFILES.online };
  private originalFetch: FetchFunction | null = null;
  private installed = false;

  public getProfile(): NetworkProfileConfig {
    return { ...this.currentProfile };
  }

  public setProfile(profile: NetworkProfileName | NetworkProfileConfig): void {
    if (typeof profile === "string") {
      const match = NETWORK_PROFILES[profile];
      if (match) {
        this.currentProfile = { ...match };
      }
    } else {
      this.currentProfile = { ...profile };
    }
  }

  public calculateTransferDelayMs(payloadSizeBytes = 0): number {
    if (this.currentProfile.offline) {
      return 0;
    }

    let delay = this.currentProfile.latencyMs;

    // Apply jitter if present (uniform jitter between 0 and jitterMs)
    if (this.currentProfile.jitterMs > 0) {
      delay += Math.random() * this.currentProfile.jitterMs;
    }

    // Bandwidth delay: (bytes * 8 bits) / (kbps * 1000 bits/sec) * 1000 ms/sec
    if (
      Number.isFinite(this.currentProfile.downloadKbps) &&
      this.currentProfile.downloadKbps > 0 &&
      payloadSizeBytes > 0
    ) {
      const bits = payloadSizeBytes * 8;
      const bitsPerSecond = this.currentProfile.downloadKbps * 1000;
      const transferMs = (bits / bitsPerSecond) * 1000;
      delay += transferMs;
    }

    return Math.round(delay);
  }

  public installFetch(targetEnv: {
    fetch?: FetchFunction | typeof fetch;
  }): void {
    if (!targetEnv || !targetEnv.fetch) return;

    this.originalFetch = targetEnv.fetch as FetchFunction;
    this.installed = true;

    const wrappedFetch: FetchFunction = async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> => {
      if (this.currentProfile.offline) {
        throw new TypeError("Failed to fetch: Network is offline (simulated)");
      }

      const delay = this.calculateTransferDelayMs();
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      if (this.originalFetch) {
        return this.originalFetch(input, init);
      }
      throw new Error("No underlying fetch implementation available");
    };

    targetEnv.fetch = Object.assign(
      wrappedFetch,
      this.originalFetch,
    ) as typeof fetch;
  }

  public uninstallFetch(targetEnv: {
    fetch?: FetchFunction | typeof fetch;
  }): void {
    if (this.installed && this.originalFetch && targetEnv) {
      targetEnv.fetch = this.originalFetch as typeof fetch;
      this.installed = false;
      this.originalFetch = null;
    }
  }
}
