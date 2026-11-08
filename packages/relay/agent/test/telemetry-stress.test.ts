import { describe, expect, it } from "bun:test";
import type {
  ConsoleEvent,
  DomMutationEvent,
  RelayTelemetryEvent,
} from "@paddy-systems/relay-protocol";
import { EventRingBuffer } from "../src/buffer.js";

describe("TASK-150: DevTools Telemetry Benchmark & Ring Buffer Stress Tests", () => {
  it("processes 5,000 DOM mutations and 100 console logs without exceeding memory or capacity boundaries", async () => {
    const ringBuffer = new EventRingBuffer(500);
    const flushedBatches: RelayTelemetryEvent[][] = [];

    // Attach mock transport emitter
    ringBuffer.attachEmitter((events) => {
      flushedBatches.push(events);
    });

    const startTime = performance.now();

    // Generate 5,000 DOM mutation events
    for (let i = 0; i < 5000; i++) {
      const domEvent: DomMutationEvent = {
        kind: "dom_mutation",
        addedNodesCount: 2,
        removedNodesCount: 1,
        targetSelector: `div.list-item-${i % 100}`,
        timestamp: Date.now(),
      };
      ringBuffer.push(domEvent);
    }

    // Generate 100 console logs
    for (let i = 0; i < 100; i++) {
      const consoleEvent: ConsoleEvent = {
        kind: "console",
        level: "info",
        args: [
          `Telemetry heartbeat event #${i}`,
          JSON.stringify({ index: i, status: "ok" }),
        ],
        timestamp: Date.now(),
      };
      ringBuffer.push(consoleEvent);
    }

    const durationMs = performance.now() - startTime;

    // Verify ring buffer capacity invariant: never exceeds specified capacity
    expect(ringBuffer.size()).toBeLessThanOrEqual(500);

    // Verify high throughput: processing 5,100 events finishes in under 100ms
    expect(durationMs).toBeLessThan(100);

    // Verify memory serialization overhead is well within 25MB boundary (< 1MB expected)
    const jsonOverhead = JSON.stringify(flushedBatches.slice(-10)).length;
    expect(jsonOverhead).toBeLessThan(1024 * 1024); // < 1MB
  });

  it("handles unattached buffer overflow by dropping oldest events while preserving newest", () => {
    const unattachedBuffer = new EventRingBuffer(100);

    for (let i = 0; i < 250; i++) {
      const event: ConsoleEvent = {
        kind: "console",
        level: "log",
        args: [`item-${i}`],
        timestamp: i,
      };
      unattachedBuffer.push(event);
    }

    expect(unattachedBuffer.size()).toBe(100);

    const items = unattachedBuffer.toArray() as ConsoleEvent[];
    // First item in buffer should be item-150 (items 0-149 were evicted)
    expect(items[0]?.args[0]).toBe("item-150");
    // Last item should be item-249
    expect(items[99]?.args[0]).toBe("item-249");
  });
});
