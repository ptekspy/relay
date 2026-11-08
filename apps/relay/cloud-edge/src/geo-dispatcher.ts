/**
 * Regional Edge Geo-DNS & Low-Latency Dispatcher
 *
 * Routes incoming tunnel connections and receiver requests to the nearest
 * healthy edge point-of-presence (POP) across EU-West, US-East, US-West, and AP-East.
 *
 * Note for Octavia: This handles client geographic proximity and edge region failover.
 */

export type EdgeRegionId = "eu-west" | "us-east" | "us-west" | "ap-east";

export interface EdgePopMetadata {
  regionId: EdgeRegionId;
  name: string;
  domain: string;
  latitude: number;
  longitude: number;
  isHealthy: boolean;
  baseLatencyMs: number;
}

export interface DispatchPlan {
  targetRegion: EdgeRegionId;
  popDomain: string;
  estimatedLatencyMs: number;
  failoverUsed: boolean;
}

export class GeoEdgeDispatcher {
  private readonly pops: Map<EdgeRegionId, EdgePopMetadata> = new Map([
    [
      "eu-west",
      {
        regionId: "eu-west",
        name: "Europe West (London / Frankfurt)",
        domain: "eu-west.relay.paddy.systems",
        latitude: 51.5074,
        longitude: -0.1278,
        isHealthy: true,
        baseLatencyMs: 12,
      },
    ],
    [
      "us-east",
      {
        regionId: "us-east",
        name: "US East (N. Virginia)",
        domain: "us-east.relay.paddy.systems",
        latitude: 38.8048,
        longitude: -77.0469,
        isHealthy: true,
        baseLatencyMs: 15,
      },
    ],
    [
      "us-west",
      {
        regionId: "us-west",
        name: "US West (Oregon)",
        domain: "us-west.relay.paddy.systems",
        latitude: 45.5152,
        longitude: -122.6784,
        isHealthy: true,
        baseLatencyMs: 18,
      },
    ],
    [
      "ap-east",
      {
        regionId: "ap-east",
        name: "Asia Pacific East (Tokyo / Singapore)",
        domain: "ap-east.relay.paddy.systems",
        latitude: 35.6762,
        longitude: 139.6503,
        isHealthy: true,
        baseLatencyMs: 22,
      },
    ],
  ]);

  private readonly countryRegionMap: Record<string, EdgeRegionId> = {
    // Europe
    GB: "eu-west",
    IE: "eu-west",
    DE: "eu-west",
    FR: "eu-west",
    NL: "eu-west",
    ES: "eu-west",
    IT: "eu-west",
    SE: "eu-west",
    CH: "eu-west",

    // US East & Atlantic
    US: "us-east", // Default US to east unless western state specified
    CA: "us-east",
    BR: "us-east",

    // Asia & Pacific
    JP: "ap-east",
    SG: "ap-east",
    AU: "ap-east",
    NZ: "ap-east",
    IN: "ap-east",
    KR: "ap-east",
  };

  public setRegionHealth(regionId: EdgeRegionId, isHealthy: boolean): void {
    const pop = this.pops.get(regionId);
    if (pop) {
      pop.isHealthy = isHealthy;
    }
  }

  public dispatchByCountry(countryCode?: string): DispatchPlan {
    const defaultRegion: EdgeRegionId = "eu-west";
    const mapped = countryCode
      ? this.countryRegionMap[countryCode.toUpperCase()]
      : undefined;
    const target = mapped ?? defaultRegion;

    const primaryPop = this.pops.get(target);
    if (primaryPop && primaryPop.isHealthy) {
      return {
        targetRegion: target,
        popDomain: primaryPop.domain,
        estimatedLatencyMs: primaryPop.baseLatencyMs,
        failoverUsed: false,
      };
    }

    // Failover: pick the first healthy POP
    for (const [regionId, pop] of this.pops.entries()) {
      if (pop.isHealthy) {
        return {
          targetRegion: regionId,
          popDomain: pop.domain,
          estimatedLatencyMs: pop.baseLatencyMs + 45, // Add inter-region penalty
          failoverUsed: true,
        };
      }
    }

    // If all unhealthy, return target anyway as degraded fallback
    return {
      targetRegion: target,
      popDomain: primaryPop?.domain ?? "relay.paddy.systems",
      estimatedLatencyMs: 150,
      failoverUsed: true,
    };
  }

  public dispatchByCoordinates(lat: number, lon: number): DispatchPlan {
    let closestRegion: EdgeRegionId = "eu-west";
    let minDistance = Number.POSITIVE_INFINITY;

    for (const [regionId, pop] of this.pops.entries()) {
      if (!pop.isHealthy) continue;

      const dist = this.haversineDistance(
        lat,
        lon,
        pop.latitude,
        pop.longitude,
      );
      if (dist < minDistance) {
        minDistance = dist;
        closestRegion = regionId;
      }
    }

    const pop = this.pops.get(closestRegion);
    // Rough latency estimate: ~1ms per 100km fiber + baseLatency
    const estimatedLatency = Math.min(
      pop ? pop.baseLatencyMs + Math.round(minDistance / 100) : 50,
      200,
    );

    return {
      targetRegion: closestRegion,
      popDomain: pop?.domain ?? "relay.paddy.systems",
      estimatedLatencyMs: estimatedLatency,
      failoverUsed: false,
    };
  }

  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
