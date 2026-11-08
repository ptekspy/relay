import { describe, expect, it } from "bun:test";
import { EdgeWorkerPoolManager } from "../src/pools";

describe("TASK-101: Standalone Cloud Edge Service Scaffold", () => {
  it("initializes worker pools with configured concurrency limits", () => {
    const manager = new EdgeWorkerPoolManager({
      maxSignalingWorkers: 2,
      maxDataProxyWorkers: 4,
    });

    const sigMetrics = manager.getMetrics("signaling");
    const dataMetrics = manager.getMetrics("data_proxy");

    expect(sigMetrics.maxWorkers).toBe(2);
    expect(sigMetrics.activeWorkers).toBe(0);
    expect(dataMetrics.maxWorkers).toBe(4);
    expect(dataMetrics.activeWorkers).toBe(0);
  });

  it("handles resource acquisition and backpressure queuing cleanly", () => {
    const manager = new EdgeWorkerPoolManager({
      maxSignalingWorkers: 1,
      maxDataProxyWorkers: 2,
    });

    expect(manager.acquire("signaling")).toBe(true);
    expect(manager.acquire("signaling")).toBe(false); // Exceeded capacity -> queued
    expect(manager.getMetrics("signaling").queuedTasks).toBe(1);

    manager.release("signaling");
    expect(manager.getMetrics("signaling").activeWorkers).toBe(1); // Queue item promoted
    expect(manager.getMetrics("signaling").queuedTasks).toBe(0);

    manager.release("signaling");
    expect(manager.getMetrics("signaling").activeWorkers).toBe(0);
    expect(manager.getMetrics("signaling").processedTasks).toBe(2);
  });
});
