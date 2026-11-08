import { describe, expect, it } from "bun:test";
import { buildStandaloneHtmlReplay, FIVE_MB_LIMIT } from "../src/bundle.js";
import type { ReplayEventWrapper } from "../src/types.js";

describe("TASK-179: Export Recording to Standalone Self-Contained HTML File", () => {
  const events: ReplayEventWrapper[] = [
    {
      id: "evt-1",
      sequenceNumber: 1,
      timestamp: 1720000000000,
      receiverId: "rec-1",
      event: {
        kind: "dom_mutation",
        targetSelector: "BODY",
        addedNodesCount: 1,
        removedNodesCount: 0,
        timestamp: 1720000000000,
      },
    },
    {
      id: "evt-2",
      sequenceNumber: 2,
      timestamp: 1720000002000,
      receiverId: "rec-1",
      event: {
        kind: "console",
        level: "error",
        args: ["NetworkError: 502 Bad Gateway from API gateway"],
        timestamp: 1720000002000,
      },
    },
    {
      id: "evt-3",
      sequenceNumber: 3,
      timestamp: 1720000004000,
      receiverId: "rec-1",
      event: {
        kind: "network",
        method: "POST",
        url: "https://api.paddy.systems/checkout",
        status: 502,
        durationMs: 200,
        timestamp: 1720000004000,
      },
    },
  ];

  it("compiles offline HTML file with zero remote CDN dependencies", () => {
    const html = buildStandaloneHtmlReplay({
      sessionId: "sess_offline_99",
      events,
    });

    // Zero remote CDN scripts or links
    expect(html).not.toContain("https://cdn.");
    expect(html).not.toContain("https://unpkg.com");
    expect(html).not.toContain("https://cdnjs.");

    // Contains self-contained markup and scripts
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("⚡ Relay Standalone Replay");
    expect(html).toContain("Session: `sess_offline_99`");
    expect(html).toContain("Offline Compatible (100% Embedded)");
    expect(html).toContain("NetworkError: 502 Bad Gateway");
  });

  it("strictly enforces < 5MB bundle size budget", () => {
    // Generate large session with 5,000 events
    const largeEvents: ReplayEventWrapper[] = [];
    for (let i = 0; i < 5000; i++) {
      largeEvents.push({
        id: `evt-${i}`,
        sequenceNumber: i,
        timestamp: 1720000000000 + i * 100,
        receiverId: "rec-1",
        event: {
          kind: "console",
          level: "info",
          args: [`Synthetic audit ping event sequence #${i}`],
          timestamp: 1720000000000 + i * 100,
        },
      });
    }

    const html = buildStandaloneHtmlReplay({
      sessionId: "sess_massive_stress",
      events: largeEvents,
    });

    const sizeBytes = Buffer.byteLength(html, "utf8");
    expect(sizeBytes).toBeLessThan(FIVE_MB_LIMIT);
  });
});
