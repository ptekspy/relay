import { describe, expect, it } from "bun:test";
import {
  NETWORK_PROFILES,
  NetworkThrottlerController,
} from "../src/network-throttler.js";

describe("TASK-134: Remote Network Throttling Simulation", () => {
  it("computes baseline latency and bandwidth delay for Slow 3G", () => {
    const throttler = new NetworkThrottlerController();
    throttler.setProfile("slow-3g");

    const profile = throttler.getProfile();
    expect(profile.downloadKbps).toBe(400);
    expect(profile.latencyMs).toBe(400);

    // 0 bytes payload has baseline latency of 400ms (+ jitter up to 20ms)
    const delay = throttler.calculateTransferDelayMs(0);
    expect(delay).toBeGreaterThanOrEqual(400);
    expect(delay).toBeLessThanOrEqual(430);

    // 50KB payload: (50,000 * 8) / (400 * 1000) * 1000 = 1000ms bandwidth delay + 400ms latency = ~1400ms
    const delay50k = throttler.calculateTransferDelayMs(50_000);
    expect(delay50k).toBeGreaterThanOrEqual(1390);
    expect(delay50k).toBeLessThanOrEqual(1440);
  });

  it("blocks requests with TypeError when offline profile is active", async () => {
    const throttler = new NetworkThrottlerController();
    throttler.setProfile("offline");

    const mockFetch = async () => new Response("ok");
    const env = { fetch: mockFetch as unknown as typeof fetch };

    throttler.installFetch(env);

    let errorThrown: Error | null = null;
    try {
      await env.fetch("http://localhost:3000/api");
    } catch (err) {
      errorThrown = err as Error;
    }

    expect(errorThrown).not.toBeNull();
    expect(errorThrown instanceof TypeError).toBe(true);
    expect(errorThrown?.message).toContain("offline");

    throttler.uninstallFetch(env);
    expect(env.fetch).toBe(mockFetch as unknown as typeof fetch);
  });
});
