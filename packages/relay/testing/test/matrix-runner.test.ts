import { describe, expect, it } from "bun:test";
import {
  type MatrixDeviceTarget,
  MatrixTestRunner,
} from "../src/matrix-runner.js";

describe("TASK-186: Matrix Testing Runner across Connected Android, iOS & Browser Receivers", () => {
  const runner = new MatrixTestRunner();

  const devices: MatrixDeviceTarget[] = [
    {
      id: "dev-pixel",
      name: "Google Pixel 8",
      platform: "android",
      osVersion: "14",
    },
    {
      id: "dev-galaxy",
      name: "Samsung Galaxy S24",
      platform: "android",
      osVersion: "14",
    },
    {
      id: "dev-iphone",
      name: "iPhone 15 Pro",
      platform: "ios",
      osVersion: "17.4",
    },
    {
      id: "dev-chrome",
      name: "Desktop Chrome Headless",
      platform: "browser",
    },
  ];

  it("orchestrates parallel execution across matrix devices and aggregates summary", async () => {
    const summary = await runner.runMatrix(devices, async (device) => {
      // Simulate slight delay
      await new Promise((resolve) => setTimeout(resolve, 5));

      if (device.platform === "ios") {
        return {
          passed: false,
          error: "Safari WebKit touch-action CSS defect detected",
        };
      }
      return { passed: true };
    });

    expect(summary.total).toBe(4);
    expect(summary.passed).toBe(3);
    expect(summary.failed).toBe(1);
    expect(summary.results.length).toBe(4);

    const iosResult = summary.results.find((r) => r.platform === "ios");
    expect(iosResult?.passed).toBe(false);
    expect(iosResult?.error).toContain("Safari WebKit");

    const androidResult = summary.results.find(
      (r) => r.deviceId === "dev-pixel",
    );
    expect(androidResult?.passed).toBe(true);
    expect(androidResult?.durationMs).toBeGreaterThanOrEqual(4);
  });

  it("renders human-readable ASCII summary table", async () => {
    const summary = await runner.runMatrix(devices.slice(0, 2), async () => ({
      passed: true,
    }));

    const table = runner.renderSummaryTable(summary);
    expect(table).toContain("Google Pixel 8");
    expect(table).toContain("Samsung Galaxy S24");
    expect(table).toContain("✓ PASS");
    expect(table).toContain("Total: 2 | Passed: 2 | Failed: 0");
  });
});
