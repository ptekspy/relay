/**
 * Global Anycast DNS & Edge Multi-Region Cluster Architecture
 *
 * Simulates and routes client ingress across 4 global edge regions:
 * US-East (Virginia), US-West (Oregon), EU-Central (Frankfurt), and AP-Southeast (Singapore).
 * Performs health checks and seamless zero-downtime failover to the nearest geographic cluster.
 *
 * Note for Octavia: Exported from @paddy-systems/relay-infra/anycast.
 */

export type GlobalRegion =
  | "us-east"
  | "us-west"
  | "eu-central"
  | "ap-southeast";

export type EdgeNodeStatus = "healthy" | "degraded" | "offline";

export interface RegionCoordinates {
  latitude: number;
  longitude: number;
}

export const REGION_COORDINATES: Record<GlobalRegion, RegionCoordinates> = {
  "us-east": { latitude: 38.0322, longitude: -78.4777 }, // Virginia
  "us-west": { latitude: 45.5152, longitude: -122.6784 }, // Oregon
  "eu-central": { latitude: 50.1109, longitude: 8.6821 }, // Frankfurt
  "ap-southeast": { latitude: 1.3521, longitude: 103.8198 }, // Singapore
};

export interface EdgeProxyNode {
  id: string;
  region: GlobalRegion;
  endpoint: string;
  ip: string;
  status: EdgeNodeStatus;
  activeConnections: number;
}

export interface GeoRoutingDecision {
  targetNode: EdgeProxyNode;
  routedRegion: GlobalRegion;
  failoverApplied: boolean;
  originalRegion?: GlobalRegion;
  distanceKm: number;
}

export class AnycastClusterRouter {
  private nodes = new Map<string, EdgeProxyNode>();

  public registerNode(node: EdgeProxyNode): void {
    this.nodes.set(node.id, { ...node });
  }

  public setNodeStatus(nodeId: string, status: EdgeNodeStatus): void {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }
    node.status = status;
  }

  public getHealthyNodesForRegion(region: GlobalRegion): EdgeProxyNode[] {
    return Array.from(this.nodes.values()).filter(
      (n) => n.region === region && n.status !== "offline",
    );
  }

  public routeClient(clientGeo: {
    latitude: number;
    longitude: number;
    preferredRegion?: GlobalRegion;
  }): GeoRoutingDecision {
    // 1. Sort all regions by geographic distance (Haversine formula)
    const sortedRegions = (
      Object.keys(REGION_COORDINATES) as GlobalRegion[]
    ).map((region) => {
      const coords = REGION_COORDINATES[region];
      const distance = this.haversineDistance(
        clientGeo.latitude,
        clientGeo.longitude,
        coords.latitude,
        coords.longitude,
      );
      return { region, distance };
    });

    sortedRegions.sort((a, b) => a.distance - b.distance);

    const primaryCandidate = sortedRegions[0];
    if (!primaryCandidate) {
      throw new Error("No global regions configured");
    }

    // 2. Check if primary closest region has healthy nodes
    let selectedRegion = primaryCandidate.region;
    let failoverApplied = false;
    let originalRegion: GlobalRegion | undefined;

    let availableNodes = this.getHealthyNodesForRegion(selectedRegion);

    if (availableNodes.length === 0) {
      // Primary region is down, failover to next closest healthy region
      originalRegion = selectedRegion;
      failoverApplied = true;

      for (const candidate of sortedRegions.slice(1)) {
        const healthy = this.getHealthyNodesForRegion(candidate.region);
        if (healthy.length > 0) {
          selectedRegion = candidate.region;
          availableNodes = healthy;
          break;
        }
      }
    }

    if (availableNodes.length === 0) {
      throw new Error("Global outage: all edge regions are offline");
    }

    // Pick least-loaded node in target region
    availableNodes.sort((a, b) => a.activeConnections - b.activeConnections);
    const targetNode = availableNodes[0];

    if (!targetNode) {
      throw new Error("No target node available in selected region");
    }

    const finalDistance = this.haversineDistance(
      clientGeo.latitude,
      clientGeo.longitude,
      REGION_COORDINATES[selectedRegion].latitude,
      REGION_COORDINATES[selectedRegion].longitude,
    );

    return {
      targetNode,
      routedRegion: selectedRegion,
      failoverApplied,
      originalRegion,
      distanceKm: Math.round(finalDistance),
    };
  }

  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371; // Earth radius in km

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
