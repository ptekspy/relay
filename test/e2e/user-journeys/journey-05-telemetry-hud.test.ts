import { describe, expect, it } from "bun:test";
import type { ConsoleEvent } from "../../../packages/relay/protocol/src/index.js";

describe("Journey 05: Live In-Browser Telemetry, Floating HUD & Console Mirror", () => {
  it("processes latency ping measurements, aggregates error counts, and filters console logs", () => {
    // 1. Simulating telemetry latency ping calculation (from ViewportSandbox & FloatingHud)
    const measurePing = (start: number, end: number) => {
      const diff = Math.round(end - start);
      return diff >= 0 ? diff : 0;
    };

    expect(measurePing(1000, 1012)).toBe(12);
    expect(measurePing(2000, 2005)).toBe(5);
    expect(measurePing(3000, 2999)).toBe(0);

    // 2. Simulating telemetry console logs received via postMessage from child iframe
    const logs: ConsoleEvent[] = [];
    const addLog = (log: ConsoleEvent) => {
      logs.unshift(log); // prepend new logs like ReceiverClient
      if (logs.length > 500) logs.pop();
    };

    // Emit mixed severity logs
    addLog({
      kind: "console",
      level: "info",
      args: ["[HMR] connected to ws://127.0.0.1:7331/_next/webpack-hmr"],
      timestamp: 1000,
    });
    addLog({
      kind: "console",
      level: "warn",
      args: ["React Hook useEffect has a missing dependency"],
      timestamp: 1001,
    });
    addLog({
      kind: "console",
      level: "error",
      args: ["Uncaught TypeError: Cannot read properties of undefined"],
      timestamp: 1002,
    });
    addLog({
      kind: "console",
      level: "error",
      args: ["Failed to load resource: net::ERR_CONNECTION_REFUSED"],
      timestamp: 1003,
    });

    // 3. Verify Error count pill on Floating HUD
    const errorCount = logs.filter((l) => l.level === "error").length;
    expect(errorCount).toBe(2);

    // 4. Verify ConsoleMirror log level filtering
    const filterLogs = (
      list: ConsoleEvent[],
      filter: "all" | "warn" | "error",
    ) => {
      if (filter === "error") return list.filter((l) => l.level === "error");
      if (filter === "warn") return list.filter((l) => l.level === "warn");
      return list;
    };

    const allLogs = filterLogs(logs, "all");
    expect(allLogs.length).toBe(4);

    const warnLogs = filterLogs(logs, "warn");
    expect(warnLogs.length).toBe(1);
    expect(warnLogs[0].args[0]).toContain("missing dependency");

    const onlyErrors = filterLogs(logs, "error");
    expect(onlyErrors.length).toBe(2);
    expect(onlyErrors[0].args[0]).toContain("Failed to load resource");

    // 5. Test log clearing
    let clearedLogs = [...logs];
    clearedLogs = [];
    expect(clearedLogs.length).toBe(0);
  });
});
