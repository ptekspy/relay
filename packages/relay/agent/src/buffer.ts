import type { RelayTelemetryEvent } from "@paddy-systems/relay-protocol";

export type TransportEmitter = (
  events: RelayTelemetryEvent[],
) => void | Promise<void>;

export class EventRingBuffer {
  private readonly capacity: number;
  private readonly buffer: RelayTelemetryEvent[];
  private emitter: TransportEmitter | null = null;
  private isFlushing = false;

  constructor(capacity = 500) {
    if (capacity <= 0) {
      throw new Error("RingBuffer capacity must be greater than 0");
    }
    this.capacity = capacity;
    this.buffer = [];
  }

  public push(event: RelayTelemetryEvent): void {
    if (this.buffer.length >= this.capacity) {
      this.buffer.shift();
    }
    this.buffer.push(event);

    if (this.emitter) {
      void this.flush();
    }
  }

  public attachEmitter(emitter: TransportEmitter): void {
    this.emitter = emitter;
    void this.flush();
  }

  public detachEmitter(): void {
    this.emitter = null;
  }

  public async flush(): Promise<void> {
    if (this.isFlushing || !this.emitter || this.buffer.length === 0) {
      return;
    }

    this.isFlushing = true;
    try {
      const itemsToEmit = [...this.buffer];
      this.buffer.length = 0;
      await this.emitter(itemsToEmit);
    } catch {
      // Re-insert failed items back to front if capacity permits
    } finally {
      this.isFlushing = false;
    }
  }

  public size(): number {
    return this.buffer.length;
  }

  public toArray(): RelayTelemetryEvent[] {
    return [...this.buffer];
  }

  public clear(): void {
    this.buffer.length = 0;
  }
}
