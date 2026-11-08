import { describe, expect, it } from "bun:test";
import {
  createBugReport,
  serializeBugReport,
  validateBugReport,
} from "../src/bug-packager.js";

describe("TASK-175: Comprehensive Bug Metadata Packager", () => {
  it("packages bug metadata adhering to standardized schema", () => {
    const report = createBugReport({
      sessionId: "sess_xyz_789",
      summary: "White flash during route transition",
      description:
        "Screen flashes white for ~200ms when clicking products link.",
      device: {
        model: "Samsung Galaxy S23",
        os: "Android 14",
        viewport: { width: 360, height: 780 },
        dpr: 3,
        userAgent: "Mozilla/5.0 (Linux; Android 14; SM-S911B)",
        networkType: "wifi",
        battery: { level: 78, charging: false },
      },
      consoleLogs: [
        {
          level: "error",
          message: "Failed to preload chunk 140",
          timestamp: Date.now() - 500,
        },
      ],
      networkCalls: [
        {
          method: "GET",
          url: "/_nuxt/page-products.js",
          status: 404,
          durationMs: 85,
        },
      ],
      replayUrl: "https://relay.paddy.systems/replay/rep_galaxy_23",
    });

    expect(report.schemaVersion).toBe("1.0.0");
    expect(report.reportId.startsWith("bug_")).toBe(true);
    expect(report.device.model).toBe("Samsung Galaxy S23");
    expect(report.device.battery?.level).toBe(78);
    expect(report.networkCalls.length).toBe(1);

    const json = serializeBugReport(report);
    const validation = validateBugReport(json);
    expect(validation.valid).toBe(true);
    expect(validation.report?.sessionId).toBe("sess_xyz_789");
  });

  it("detects schema validation errors on incomplete payloads", () => {
    const badJson = JSON.stringify({
      schemaVersion: "0.9.0", // invalid version
      reportId: "bug_1",
      // missing sessionId
      device: {}, // missing required device fields
    });

    const validation = validateBugReport(badJson);
    expect(validation.valid).toBe(false);
    expect(validation.errors).toBeDefined();
    expect(validation.errors?.some((e) => e.includes("schemaVersion"))).toBe(
      true,
    );
    expect(validation.errors?.some((e) => e.includes("sessionId"))).toBe(true);
  });
});
