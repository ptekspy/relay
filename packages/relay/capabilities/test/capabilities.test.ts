import { describe, expect, it } from "bun:test";
import {
  createUnsupportedOperationError,
  evaluateBatteryThrottle,
  evaluateScreenCaptureFeasibility,
  getDiagnosticError,
  parseUserAgentMetadata,
  RelayCapabilitySetSchema,
  resolveNegotiatedCapabilities,
} from "../src/index.js";

describe("Relay Capabilities: Schema & Negotiation (TASK-P11, TASK-P13)", () => {
  it("validates valid capability set with defaults", () => {
    const caps = RelayCapabilitySetSchema.parse({
      touch: true,
      webrtc: true,
    });
    expect(caps.touch).toBe(true);
    expect(caps.webrtc).toBe(true);
    expect(caps.dom).toBe(true);
    expect(caps.screenRecording).toBe(false);
  });

  it("calculates intersection of host and receiver capabilities", () => {
    const host = RelayCapabilitySetSchema.parse({
      dom: true,
      touch: true,
      webrtc: true,
      screenRecording: false,
    });
    const receiver = RelayCapabilitySetSchema.parse({
      dom: true,
      touch: false,
      webrtc: true,
      screenRecording: true,
    });

    const active = resolveNegotiatedCapabilities(host, receiver);
    expect(active.dom).toBe(true);
    expect(active.webrtc).toBe(true);
    expect(active.touch).toBe(false);
    expect(active.screenRecording).toBe(false);
  });
});

describe("Relay Capabilities: User-Agent Parsing (TASK-P15)", () => {
  it("identifies iPhone Safari correctly", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1";
    const parsed = parseUserAgentMetadata(ua);
    expect(parsed.deviceType).toBe("mobile_browser");
    expect(parsed.browserName).toBe("Safari");
    expect(parsed.osName).toBe("iOS");
    expect(parsed.model).toBe("Apple iPhone");
  });

  it("identifies Android Chrome correctly", () => {
    const ua =
      "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro Build/UD1A.230803.041) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36";
    const parsed = parseUserAgentMetadata(ua);
    expect(parsed.deviceType).toBe("mobile_browser");
    expect(parsed.browserName).toBe("Chrome");
    expect(parsed.osName).toBe("Android");
    expect(parsed.model).toContain("Pixel 8 Pro");
  });

  it("identifies CLI user agent", () => {
    const ua = "relay-cli/1.0.0 (linux-x64; bun/1.4.0)";
    const parsed = parseUserAgentMetadata(ua);
    expect(parsed.deviceType).toBe("cli");
  });
});

describe("Relay Capabilities: Error Catalog & Remediation (TASK-P14, TASK-P16)", () => {
  it("generates unsupported capability error with remediation", () => {
    const error = createUnsupportedOperationError("haptics", "desktop_browser");
    expect(error.code).toBe("ERR_UNSUPPORTED_CAPABILITY");
    expect(error.message).toContain("haptics");
    expect(error.remediation).toContain("vibration motor");
  });

  it("retrieves diagnostic error with actionable guidance", () => {
    const diag = getDiagnosticError("ERR_PORT_BLOCKED");
    expect(diag.title).toBe("Upstream Dev Server Unreachable");
    expect(diag.actionableSteps.length).toBeGreaterThan(1);
  });
});

describe("Relay Capabilities: Screen Capture & Battery (TASK-P17, TASK-P18)", () => {
  it("recommends DOM replay for mobile browser", () => {
    const feasibility = evaluateScreenCaptureFeasibility("mobile_browser");
    expect(feasibility.recommendedType).toBe("dom_replay");
    expect(feasibility.requiresUserGesture).toBe(false);
  });

  it("throttles telemetry when battery is critical and discharging", () => {
    const throttle = evaluateBatteryThrottle({ level: 0.15, charging: false });
    expect(throttle.shouldThrottle).toBe(true);
    expect(throttle.targetTelemetryHz).toBe(10);
  });

  it("does not throttle when battery is charging", () => {
    const throttle = evaluateBatteryThrottle({ level: 0.15, charging: true });
    expect(throttle.shouldThrottle).toBe(false);
    expect(throttle.targetTelemetryHz).toBe(60);
  });
});
