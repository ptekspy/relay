import { describe, expect, it } from "bun:test";
import { WorkerThreadMonitor } from "../src/thread-monitor.js";

describe("TASK-149: Web Worker & Shared Worker Activity Monitor", () => {
  it("registers workers and tracks message passing frequency", () => {
    const monitor = new WorkerThreadMonitor();

    const w1 = monitor.registerWorker("web-worker", "/workers/parser.js");
    const w2 = monitor.registerWorker("shared-worker", "/workers/sync.js");

    monitor.recordMessageSent(w1.id);
    monitor.recordMessageSent(w1.id);
    monitor.recordMessageReceived(w1.id);

    monitor.recordMessageSent(w2.id);

    const snapshot = monitor.getSnapshot();
    expect(snapshot.totalActiveWorkers).toBe(2);
    expect(snapshot.totalMessagesPassed).toBe(4);

    const record1 = snapshot.workers.find((w) => w.id === w1.id);
    expect(record1?.scriptUrl).toBe("/workers/parser.js");
    expect(record1?.messagesSent).toBe(2);
    expect(record1?.messagesReceived).toBe(1);
    expect(record1?.active).toBe(true);
  });

  it("updates active status when worker terminates", () => {
    const monitor = new WorkerThreadMonitor();
    const w1 = monitor.registerWorker("web-worker", "/workers/compute.js");

    expect(monitor.getSnapshot().totalActiveWorkers).toBe(1);

    monitor.markWorkerTerminated(w1.id);

    const snapshot = monitor.getSnapshot();
    expect(snapshot.totalActiveWorkers).toBe(0);
    expect(snapshot.workers[0]?.active).toBe(false);
  });
});
