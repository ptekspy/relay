import { beforeEach, describe, expect, it } from "bun:test";
import {
  AnycastClusterRouter,
  type EdgeProxyNode,
} from "../src/anycast-cluster.js";

describe("TASK-191: Global Anycast DNS & Edge Multi-Region Cluster Architecture", () => {
  let router: AnycastClusterRouter;

  const mockNodes: EdgeProxyNode[] = [
    {
      id: "node-useast-1",
      region: "us-east",
      endpoint: "https://useast-1.relay.paddy.systems",
      ip: "198.51.100.10",
      status: "healthy",
      activeConnections: 120,
    },
    {
      id: "node-useast-2",
      region: "us-east",
      endpoint: "https://useast-2.relay.paddy.systems",
      ip: "198.51.100.11",
      status: "healthy",
      activeConnections: 45, // Less loaded
    },
    {
      id: "node-uswest-1",
      region: "us-west",
      endpoint: "https://uswest-1.relay.paddy.systems",
      ip: "198.51.100.20",
      status: "healthy",
      activeConnections: 80,
    },
    {
      id: "node-eucentral-1",
      region: "eu-central",
      endpoint: "https://eucentral-1.relay.paddy.systems",
      ip: "198.51.100.30",
      status: "healthy",
      activeConnections: 150,
    },
    {
      id: "node-apsoutheast-1",
      region: "ap-southeast",
      endpoint: "https://apsoutheast-1.relay.paddy.systems",
      ip: "198.51.100.40",
      status: "healthy",
      activeConnections: 60,
    },
  ];

  beforeEach(() => {
    router = new AnycastClusterRouter();
    for (const node of mockNodes) {
      router.registerNode(node);
    }
  });

  it("routes London client to nearest EU-Central cluster and picks lowest-load node", () => {
    // London coordinates: 51.5074, -0.1278
    const decision = router.routeClient({
      latitude: 51.5074,
      longitude: -0.1278,
    });

    expect(decision.routedRegion).toBe("eu-central");
    expect(decision.failoverApplied).toBe(false);
    expect(decision.targetNode.id).toBe("node-eucentral-1");
    expect(decision.distanceKm).toBeLessThan(700); // Frankfurt is ~640km from London
  });

  it("routes New York client to US-East and selects the least-loaded node", () => {
    // New York coordinates: 40.7128, -74.0060
    const decision = router.routeClient({
      latitude: 40.7128,
      longitude: -74.006,
    });

    expect(decision.routedRegion).toBe("us-east");
    expect(decision.failoverApplied).toBe(false);
    // Picks node-useast-2 (45 connections) over node-useast-1 (120 connections)
    expect(decision.targetNode.id).toBe("node-useast-2");
  });

  it("performs seamless multi-region failover when nearest region is offline", () => {
    // Mark EU-Central node as offline
    router.setNodeStatus("node-eucentral-1", "offline");

    // Paris client: 48.8566, 2.3522 (closest to EU-Central, but EU is down)
    const decision = router.routeClient({
      latitude: 48.8566,
      longitude: 2.3522,
    });

    expect(decision.failoverApplied).toBe(true);
    expect(decision.originalRegion).toBe("eu-central");
    // Next closest region across the Atlantic is US-East
    expect(decision.routedRegion).toBe("us-east");
    expect(decision.targetNode.region).toBe("us-east");
  });
});
