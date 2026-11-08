import { describe, expect, it } from "bun:test";
import { GeoEdgeDispatcher } from "../src/geo-dispatcher";

describe("TASK-107: Regional Edge Geo-DNS & Low-Latency Dispatcher", () => {
  it("routes incoming connections to the nearest edge POP by country code", () => {
    const dispatcher = new GeoEdgeDispatcher();

    const planGB = dispatcher.dispatchByCountry("GB");
    expect(planGB.targetRegion).toBe("eu-west");
    expect(planGB.popDomain).toBe("eu-west.relay.paddy.systems");
    expect(planGB.estimatedLatencyMs).toBeLessThanOrEqual(50);
    expect(planGB.failoverUsed).toBe(false);

    const planJP = dispatcher.dispatchByCountry("JP");
    expect(planJP.targetRegion).toBe("ap-east");
    expect(planJP.popDomain).toBe("ap-east.relay.paddy.systems");
    expect(planJP.failoverUsed).toBe(false);

    const planUS = dispatcher.dispatchByCountry("US");
    expect(planUS.targetRegion).toBe("us-east");
    expect(planUS.failoverUsed).toBe(false);
  });

  it("calculates closest POP via coordinate distance (Haversine formula)", () => {
    const dispatcher = new GeoEdgeDispatcher();

    // Paris, France (approx 48.8566 N, 2.3522 E) should route to eu-west (London)
    const planParis = dispatcher.dispatchByCoordinates(48.8566, 2.3522);
    expect(planParis.targetRegion).toBe("eu-west");

    // Seattle, WA (approx 47.6062 N, -122.3321 W) should route to us-west (Oregon)
    const planSeattle = dispatcher.dispatchByCoordinates(47.6062, -122.3321);
    expect(planSeattle.targetRegion).toBe("us-west");
  });

  it("automatically fails over to nearest healthy POP when primary region is degraded", () => {
    const dispatcher = new GeoEdgeDispatcher();

    // Mark eu-west as unhealthy
    dispatcher.setRegionHealth("eu-west", false);

    const planGB = dispatcher.dispatchByCountry("GB");
    expect(planGB.targetRegion).not.toBe("eu-west");
    expect(planGB.failoverUsed).toBe(true);
    expect(["us-east", "us-west", "ap-east"]).toContain(planGB.targetRegion);
  });
});
