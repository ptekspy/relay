import { describe, expect, it } from "bun:test";
import {
  type DevicePerformanceMetrics,
  PerformanceBudgetEngine,
} from "../src/perf-budget.js";

describe("TASK-189: Performance Budget Assertion Engine (TTFB, LCP, CLS per Device)", () => {
  const engine = new PerformanceBudgetEngine();

  it("passes when all mobile vitals adhere to budget thresholds", () => {
    const goodMetrics: DevicePerformanceMetrics = {
      deviceId: "dev_pixel_8",
      deviceName: "Google Pixel 8",
      platform: "android",
      ttfbMs: 150,
      fcpMs: 800,
      lcpMs: 1200,
      cls: 0.02,
      inpMs: 45,
    };

    const result = engine.evaluateDevice(goodMetrics);
    expect(result.passed).toBe(true);
    expect(result.violations.length).toBe(0);
  });

  it("flags LCP and CLS violations with diagnostic guidance", () => {
    const sluggishMetrics: DevicePerformanceMetrics = {
      deviceId: "dev_budget_phone",
      deviceName: "Moto G Power",
      platform: "android",
      ttfbMs: 350,
      fcpMs: 1400,
      lcpMs: 3800, // Breaches 2500ms
      cls: 0.28, // Breaches 0.1
      inpMs: 80,
    };

    const result = engine.evaluateDevice(sluggishMetrics);
    expect(result.passed).toBe(false);
    expect(result.violations.length).toBe(2);

    const lcpViolation = result.violations.find((v) => v.metric === "LCP");
    expect(lcpViolation?.actual).toBe(3800);
    expect(lcpViolation?.diagnosticAdvice).toContain("hero images");

    const clsViolation = result.violations.find((v) => v.metric === "CLS");
    expect(clsViolation?.actual).toBe(0.28);
    expect(clsViolation?.diagnosticAdvice).toContain("explicit width/height");
  });

  it("evaluates entire fleet and generates CI summary message", () => {
    const fleet: DevicePerformanceMetrics[] = [
      {
        deviceId: "d1",
        deviceName: "iPhone 15 Pro",
        platform: "ios",
        ttfbMs: 120,
        fcpMs: 500,
        lcpMs: 1100,
        cls: 0.01,
      },
      {
        deviceId: "d2",
        deviceName: "Slow 3G Android",
        platform: "android",
        ttfbMs: 950, // Breaches 800ms
        fcpMs: 2200, // Breaches 1800ms
        lcpMs: 4000,
        cls: 0.05,
      },
    ];

    const fleetEval = engine.evaluateFleet(fleet);
    expect(fleetEval.passed).toBe(false);
    expect(fleetEval.summaryMessage).toContain("Slow 3G Android");
    expect(fleetEval.summaryMessage).toContain("TTFB: 950");
    expect(fleetEval.summaryMessage).toContain("FCP: 2200");
  });
});
