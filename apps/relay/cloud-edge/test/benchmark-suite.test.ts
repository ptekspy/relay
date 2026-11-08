import { describe, expect, it } from "bun:test";
import { EdgeTunnelBenchmarkSuite } from "../src/benchmark-suite";

describe("TASK-110: Edge Tunnel Benchmark & High-Concurrency Soak Test Suite", () => {
  it("executes benchmark with 500 simulated tunnels and verifies p99 SLA < 12ms", async () => {
    const suite = new EdgeTunnelBenchmarkSuite({
      concurrentTunnels: 500,
      totalRequests: 500,
      maxLatencyOverheadP99Ms: 12,
    });

    const result = await suite.runBenchmark();

    expect(result.totalRequests).toBe(500);
    expect(result.successfulRequests).toBe(500);
    expect(result.failedRequests).toBe(0);
    expect(result.concurrentTunnels).toBe(500);

    // Verify p99 latency overhead < 12ms
    expect(result.latencyPercentiles.p99).toBeLessThanOrEqual(12);
    expect(result.passedP99Sla).toBe(true);

    // Verify heap stability
    expect(result.heapDeltaMb).toBeLessThan(50); // Less than 50MB variation
  });

  it("calculates accurate percentiles across latency distributions", () => {
    const suite = new EdgeTunnelBenchmarkSuite();
    // Testing edge case where totalRequests is 0
    const emptyPercentiles = (
      suite as unknown as { calculatePercentiles: (l: number[]) => unknown }
    ).calculatePercentiles([]);
    expect(emptyPercentiles).toEqual({
      min: 0,
      p50: 0,
      p90: 0,
      p95: 0,
      p99: 0,
      max: 0,
      mean: 0,
    });
  });
});
