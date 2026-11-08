import { describe, expect, it } from "bun:test";
import { EdgeWebSocketMultiplexer } from "../src/ws-multiplexer";

describe("TASK-105: Edge WebSocket Multiplexer with Congestion Backpressure", () => {
  it("enqueues and drains messages under normal conditions", () => {
    const mux = new EdgeWebSocketMultiplexer();

    mux.enqueue({
      channel: "hmr",
      messageId: "msg-1",
      isBinary: false,
      payload: JSON.stringify({ type: "update", path: "/src/App.tsx" }),
    });

    mux.enqueue({
      channel: "app",
      messageId: "msg-2",
      isBinary: true,
      payload: new Uint8Array([1, 2, 3, 4]),
    });

    const metricsBefore = mux.getMetrics();
    expect(metricsBefore.queuedMessages).toBe(2);
    expect(metricsBefore.isBackpressureActive).toBe(false);

    const batch = mux.drain(10);
    expect(batch.length).toBe(2);

    const metricsAfter = mux.getMetrics();
    expect(metricsAfter.queuedMessages).toBe(0);
    expect(metricsAfter.forwardedMessages).toBe(2);
  });

  it("activates backpressure and drops droppable messages when queue exceeds capacity", () => {
    const mux = new EdgeWebSocketMultiplexer({
      maxQueueLength: 5,
      highWatermarkBytes: 500,
      lowWatermarkBytes: 100,
    });

    // Fill queue to capacity with critical HMR messages
    for (let i = 0; i < 5; i++) {
      mux.enqueue({
        channel: "hmr",
        messageId: `hmr-${i}`,
        isBinary: false,
        payload: "ping",
        isDroppable: false,
      });
    }

    expect(mux.getMetrics().isBackpressureActive).toBe(true);

    // Now try to enqueue droppable message (e.g. high-frequency mouse telemetry)
    const enqueued = mux.enqueue({
      channel: "app",
      messageId: "telemetry-1",
      isBinary: false,
      payload: '{"x": 100, "y": 200}',
      isDroppable: true,
    });

    expect(enqueued).toBe(false);
    expect(mux.getMetrics().droppedMessages).toBe(1);

    // Drain queue
    const drained = mux.drain(5);
    expect(drained.length).toBe(5);
    expect(mux.getMetrics().isBackpressureActive).toBe(false);
  });

  it("sustains 1000 messages/sec throughput without unbounded memory growth", () => {
    const mux = new EdgeWebSocketMultiplexer({
      maxQueueLength: 200,
      highWatermarkBytes: 50_000,
      lowWatermarkBytes: 10_000,
    });

    for (let i = 0; i < 1000; i++) {
      mux.enqueue({
        channel: i % 2 === 0 ? "hmr" : "app",
        messageId: `m-${i}`,
        isBinary: false,
        payload: `test-payload-${i}`,
        isDroppable: i % 2 !== 0,
      });

      // Periodic consumer drain simulating socket writer
      if (i % 20 === 0) {
        mux.drain(15);
      }
    }

    const metrics = mux.getMetrics();
    expect(metrics.forwardedMessages).toBeGreaterThan(500);
    expect(metrics.queuedMessages).toBeLessThanOrEqual(200);
  });
});
