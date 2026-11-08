import { describe, expect, it } from "bun:test";
import type { ConsoleEvent } from "@paddy-systems/relay-protocol";

describe("Local Web Receiver Logic & Utilities", () => {
  it("filters ambiguous characters (0, O, 1, I) from short codes", () => {
    const rawInput = "a0o1i-bc234xyz";
    // Allowed: uppercase [A-HJ-NP-Z2-9], max 6
    const sanitized = rawInput
      .toUpperCase()
      .replace(/[^A-HJ-NP-Z2-9]/g, "")
      .slice(0, 6);

    expect(sanitized).toBe("ABC234");
    expect(sanitized).not.toContain("0");
    expect(sanitized).not.toContain("O");
    expect(sanitized).not.toContain("1");
    expect(sanitized).not.toContain("I");
  });

  it("filters console log events by level", () => {
    const mockLogs: ConsoleEvent[] = [
      {
        kind: "console",
        level: "info",
        args: ["App mounted"],
        timestamp: 1000,
      },
      {
        kind: "console",
        level: "warn",
        args: ["Slow network detected"],
        timestamp: 1001,
      },
      {
        kind: "console",
        level: "error",
        args: ["Uncaught TypeError"],
        timestamp: 1002,
      },
      {
        kind: "console",
        level: "error",
        args: ["Failed to fetch /api/data"],
        timestamp: 1003,
      },
    ];

    const errorLogs = mockLogs.filter((l) => l.level === "error");
    const warnLogs = mockLogs.filter((l) => l.level === "warn");

    expect(errorLogs.length).toBe(2);
    expect(warnLogs.length).toBe(1);
    expect(mockLogs.length).toBe(4);
  });

  it("calculates network latency accurately", () => {
    const start = 1000;
    const end = 1018.4;
    const latency = Math.round(end - start);

    expect(latency).toBe(18);
  });
});
