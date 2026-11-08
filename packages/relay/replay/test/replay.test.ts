import { describe, expect, test } from "bun:test";
import {
  buildStandaloneHtmlReplay,
  CheckpointManager,
  ConsoleSynthesizer,
  DomReconstructor,
  NetworkWaterfallSynchronizer,
  ReplayEngine,
  ReplayQueryEngine,
  ReplayTimeline,
  VirtualClock,
} from "../src/index.js";
import type { ReplayEventWrapper } from "../src/types.js";

describe("ReplayEngine & Timeline Verification", () => {
  test("reconstructs and deduplicates events out-of-order", () => {
    const timeline = new ReplayTimeline();
    const e1: ReplayEventWrapper = {
      id: "evt-1",
      sequenceNumber: 1,
      timestamp: 1000,
      receiverId: "rec-1",
      event: {
        kind: "console",
        level: "info",
        args: ["First"],
        timestamp: 1000,
      },
    };
    const e2: ReplayEventWrapper = {
      id: "evt-2",
      sequenceNumber: 2,
      timestamp: 2000,
      receiverId: "rec-1",
      event: {
        kind: "console",
        level: "warn",
        args: ["Second"],
        timestamp: 2000,
      },
    };

    // Ingest out of order with duplicates
    timeline.ingest([e2, e1, e2]);

    expect(timeline.size()).toBe(2);
    const sorted = timeline.getEvents();
    expect(sorted[0]?.id).toBe("evt-1");
    expect(sorted[1]?.id).toBe("evt-2");
    expect(timeline.getDuration()).toBe(1000);
  });

  test("virtual clock handles seeking, variable speeds, and boundaries", () => {
    const clock = new VirtualClock(1000, 5000);
    expect(clock.getCurrentTime()).toBe(1000);
    expect(clock.getProgressPercent()).toBe(0);

    clock.seek(3000);
    expect(clock.getCurrentTime()).toBe(3000);
    expect(clock.getProgressPercent()).toBe(50);

    // Boundary clamp
    clock.seek(9999);
    expect(clock.getCurrentTime()).toBe(5000);
    expect(clock.getProgressPercent()).toBe(100);
    expect(clock.getState()).toBe("ended");

    // Speed setting
    clock.setSpeed(2.0);
    expect(clock.getSpeed()).toBe(2.0);
    expect(() => clock.setSpeed(0)).toThrow();
  });

  test("DOM reconstructor applies mutations and snapshots", () => {
    const dom = new DomReconstructor();
    expect(dom.getRoot().children.length).toBe(0);

    dom.applyMutation({
      kind: "dom_mutation",
      addedNodesCount: 3,
      removedNodesCount: 0,
      targetSelector: "BODY",
      timestamp: 1500,
    });

    expect(dom.getRoot().children.length).toBe(3);

    dom.applyMutation({
      kind: "dom_mutation",
      addedNodesCount: 1,
      removedNodesCount: 2,
      targetSelector: "BODY",
      timestamp: 1600,
    });

    expect(dom.getRoot().children.length).toBe(2);
  });

  test("network waterfall tracks pending vs completed states", () => {
    const waterfall = new NetworkWaterfallSynchronizer();
    waterfall.ingest([
      {
        kind: "network",
        method: "GET",
        url: "/api/users",
        status: 200,
        durationMs: 500,
        timestamp: 1000,
      },
    ]);

    // Before start
    expect(waterfall.getWaterfallStateAt(500).length).toBe(0);

    // In flight
    const inFlight = waterfall.getWaterfallStateAt(1200);
    expect(inFlight.length).toBe(1);
    expect(inFlight[0]?.state).toBe("pending");

    // Completed
    const completed = waterfall.getWaterfallStateAt(1600);
    expect(completed.length).toBe(1);
    expect(completed[0]?.state).toBe("completed");
  });

  test("console synthesizer filters by level and demangles stacks", () => {
    const synth = new ConsoleSynthesizer();
    synth.ingest([
      {
        kind: "console",
        level: "info",
        args: ["App mounted"],
        timestamp: 1000,
      },
      {
        kind: "console",
        level: "error",
        args: ["Error: failed at main-89a3f91b.js:20:10"],
        timestamp: 1500,
      },
    ]);

    const errorLogs = synth.getLogsUpTo(2000, ["error"]);
    expect(errorLogs.length).toBe(1);
    expect(errorLogs[0]?.demangledStack).toContain("main.ts:20:10");
  });

  test("query engine filters by text and criteria", () => {
    const items: ReplayEventWrapper[] = [
      {
        id: "1",
        sequenceNumber: 1,
        timestamp: 1000,
        receiverId: "r1",
        event: {
          kind: "console",
          level: "info",
          args: ["User login initiated"],
          timestamp: 1000,
        },
      },
      {
        id: "2",
        sequenceNumber: 2,
        timestamp: 2000,
        receiverId: "r1",
        event: {
          kind: "network",
          method: "POST",
          url: "/api/auth/login",
          status: 200,
          durationMs: 120,
          timestamp: 2000,
        },
      },
    ];

    const engine = new ReplayQueryEngine(items);
    const results = engine.query({ searchQuery: "login" });
    expect(results.length).toBe(2);

    const postOnly = engine.query({ kinds: ["network"] });
    expect(postOnly.length).toBe(1);
  });

  test("checkpoint manager generates periodic keyframes", () => {
    const manager = new CheckpointManager(1000);
    manager.generateKeyframes([
      {
        timestamp: 1000,
        event: {
          kind: "dom_mutation",
          addedNodesCount: 1,
          removedNodesCount: 0,
          targetSelector: "BODY",
          timestamp: 1000,
        },
      },
      {
        timestamp: 2500,
        event: {
          kind: "dom_mutation",
          addedNodesCount: 2,
          removedNodesCount: 0,
          targetSelector: "BODY",
          timestamp: 2500,
        },
      },
    ]);

    const kfs = manager.getKeyframes();
    expect(kfs.length).toBeGreaterThanOrEqual(2);
    const nearest = manager.getNearestKeyframe(2000);
    expect(nearest).not.toBeNull();
  });

  test("standalone HTML bundler generates self-contained bundle", () => {
    const bundle = buildStandaloneHtmlReplay({
      sessionId: "sess-test-123",
      events: [],
    });

    expect(bundle).toContain("<!DOCTYPE html>");
    expect(bundle).toContain("sess-test-123");
    expect(bundle).toContain("[Relay Replay]");
  });

  test("ReplayEngine facade end-to-end integration", () => {
    const engine = new ReplayEngine([
      {
        id: "e1",
        sequenceNumber: 1,
        timestamp: 1000,
        receiverId: "r1",
        event: {
          kind: "network",
          method: "GET",
          url: "/api/health",
          status: 200,
          durationMs: 50,
          timestamp: 1000,
        },
      },
      {
        id: "e2",
        sequenceNumber: 2,
        timestamp: 2000,
        receiverId: "r1",
        event: {
          kind: "console",
          level: "info",
          args: ["Completed"],
          timestamp: 2000,
        },
      },
    ]);

    engine.seek(1020);
    const snapshot = engine.getSnapshot();
    expect(snapshot.currentTime).toBe(1020);
    expect(snapshot.activeRequests.length).toBe(1);
    expect(snapshot.activeRequests[0]?.state).toBe("pending");

    engine.seek(1100);
    const completedSnapshot = engine.getSnapshot();
    expect(completedSnapshot.activeRequests[0]?.state).toBe("completed");

    engine.destroy();
  });
});
