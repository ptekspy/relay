import { describe, expect, it } from "bun:test";
import {
  StreamingResourceBenchmark,
  type StreamingResourceMetrics,
} from "../src/streaming-benchmark.js";

describe("TASK-160: Video Streaming Latency & Resource Consumption Benchmark", () => {
  it("verifies 30-minute 1080p continuous screen streaming meets battery, latency, and thermal budgets", () => {
    const metrics = StreamingResourceBenchmark.simulateStreamingRun(
      30,
      "1080p",
      30,
    );

    expect(metrics.durationMinutes).toBe(30);
    expect(metrics.batteryDrainPercent).toBeLessThan(8.0); // < 8%
    expect(metrics.averageLatencyMs).toBeLessThan(100.0); // < 100ms
    expect(metrics.thermalStatus).toBe("nominal");
    expect(metrics.averageCpuUsagePercent).toBeLessThan(40.0);

    const validation =
      StreamingResourceBenchmark.validateResourceBudgets(metrics);
    expect(validation.passed).toBe(true);
    expect(validation.violations).toEqual([]);
  });

  it("verifies 720p streaming consumes less battery and CPU than 1080p", () => {
    const m1080 = StreamingResourceBenchmark.simulateStreamingRun(
      30,
      "1080p",
      30,
    );
    const m720 = StreamingResourceBenchmark.simulateStreamingRun(
      30,
      "720p",
      30,
    );

    expect(m720.batteryDrainPercent).toBeLessThan(m1080.batteryDrainPercent);
    expect(m720.averageCpuUsagePercent).toBeLessThan(
      m1080.averageCpuUsagePercent,
    );
  });

  it("detects and flags budget violations when thermal throttling occurs or latency exceeds limits", () => {
    const degradedMetrics: StreamingResourceMetrics = {
      durationMinutes: 30,
      batteryDrainPercent: 9.5, // Exceeds 8%
      averageCpuUsagePercent: 48.0, // Exceeds 40%
      thermalStatus: "critical", // Triggers thermal throttling
      averageLatencyMs: 145.0, // Exceeds 100ms
      droppedFramesRatio: 0.12,
    };

    const validation =
      StreamingResourceBenchmark.validateResourceBudgets(degradedMetrics);
    expect(validation.passed).toBe(false);
    expect(validation.violations.length).toBe(4);
    expect(validation.violations[0]).toContain("Battery drain");
    expect(validation.violations[1]).toContain("Thermal throttling");
    expect(validation.violations[2]).toContain("Average latency");
    expect(validation.violations[3]).toContain("CPU usage");
  });
});
