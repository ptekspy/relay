import { describe, expect, it } from "bun:test";
import type {
  ConsoleEvent,
  RelayTelemetryEvent,
} from "@paddy-systems/relay-protocol";
import { RelayAgent } from "../src/agent.js";
import { EventRingBuffer } from "../src/buffer.js";
import { ConsoleInterceptor } from "../src/console.js";
import { redactSensitiveText, safeSerialize } from "../src/redaction.js";

describe("Relay Agent: EventRingBuffer (TASK-P09)", () => {
  it("enforces capacity limit and evicts oldest items", () => {
    const buffer = new EventRingBuffer(3);
    const mockEvent = (id: number): ConsoleEvent => ({
      kind: "console",
      level: "info",
      args: [`test-${id}`],
      timestamp: id,
    });

    buffer.push(mockEvent(1));
    buffer.push(mockEvent(2));
    buffer.push(mockEvent(3));
    expect(buffer.size()).toBe(3);

    buffer.push(mockEvent(4));
    expect(buffer.size()).toBe(3);
    const items = buffer.toArray() as ConsoleEvent[];
    expect(items[0]?.args).toEqual(["test-2"]);
    expect(items[2]?.args).toEqual(["test-4"]);
  });

  it("flushes immediately to attached emitter", async () => {
    const buffer = new EventRingBuffer(10);
    const emitted: RelayTelemetryEvent[][] = [];
    buffer.attachEmitter((events) => {
      emitted.push([...events]);
    });

    buffer.push({
      kind: "console",
      level: "log",
      args: ["immediate"],
      timestamp: Date.now(),
    });

    expect(emitted.length).toBe(1);
    const firstBatch = emitted[0];
    expect(firstBatch).toBeDefined();
    const firstEvent = firstBatch?.[0] as ConsoleEvent | undefined;
    expect(firstEvent?.args).toEqual(["immediate"]);
    expect(buffer.size()).toBe(0);
  });
});

describe("Relay Agent: Redaction & Serialization (TASK-P02)", () => {
  it("redacts bearer tokens and passwords", () => {
    const text =
      'Bearer secret-jwt-12345 with "password": "supersecretpassword"';
    const redacted = redactSensitiveText(text);
    expect(redacted).toContain("Bearer [REDACTED]");
    expect(redacted).toContain('"password": "[REDACTED]"');
  });

  it("safely handles circular references without throwing", () => {
    const circular: Record<string, unknown> = { name: "root" };
    circular.self = circular;

    const serialized = safeSerialize(circular);
    expect(serialized).toContain('"self": [Circular]');
  });

  it("serializes errors with stack traces", () => {
    const error = new Error("Sample failure");
    const serialized = safeSerialize(error);
    expect(serialized).toContain("Error: Sample failure");
  });
});

describe("Relay Agent: Console Interceptor (TASK-P02)", () => {
  it("intercepts console.log calls with arguments", () => {
    const logs: ConsoleEvent[] = [];
    const interceptor = new ConsoleInterceptor((e) => logs.push(e));

    interceptor.install();
    console.log("hello world", { key: "value" });
    interceptor.uninstall();

    expect(logs.length).toBeGreaterThanOrEqual(1);
    const last = logs[logs.length - 1];
    expect(last).toBeDefined();
    if (last) {
      expect(last.level).toBe("log");
      expect(last.args[0]).toBe("hello world");
      expect(last.args[1]).toContain('"key": "value"');
    }
  });
});

describe("Relay Agent: Lifecycle (TASK-P01)", () => {
  it("starts and stops cleanly without errors", () => {
    const agent = new RelayAgent({ ringBufferCapacity: 50 });
    expect(agent.active()).toBe(false);

    agent.start();
    expect(agent.active()).toBe(true);

    agent.stop();
    expect(agent.active()).toBe(false);
  });
});
