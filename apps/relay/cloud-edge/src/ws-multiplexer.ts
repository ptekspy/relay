/**
 * Edge WebSocket Dual-Channel Multiplexer with Congestion Backpressure
 *
 * Multiplexes HMR dev server WebSockets and user application WebSockets
 * with strict high/low watermark sliding buffers to prevent process OOM.
 *
 * Note for Octavia: This handles backpressure flow control for high-frequency edge sockets.
 */

export type WebSocketChannelType = "hmr" | "app";

export interface WebSocketMessageEnvelope {
  channel: WebSocketChannelType;
  messageId: string;
  isBinary: boolean;
  payload: Uint8Array | string;
  isDroppable?: boolean;
}

export interface BackpressureConfig {
  highWatermarkBytes?: number;
  lowWatermarkBytes?: number;
  maxQueueLength?: number;
}

export interface ChannelMetrics {
  queuedBytes: number;
  queuedMessages: number;
  forwardedMessages: number;
  droppedMessages: number;
  isBackpressureActive: boolean;
}

export class EdgeWebSocketMultiplexer {
  private readonly highWatermarkBytes: number;
  private readonly lowWatermarkBytes: number;
  private readonly maxQueueLength: number;

  private queue: WebSocketMessageEnvelope[] = [];
  private queuedBytes = 0;
  private isPaused = false;
  private forwardedCount = 0;
  private droppedCount = 0;

  constructor(config: BackpressureConfig = {}) {
    this.highWatermarkBytes = config.highWatermarkBytes ?? 1024 * 1024; // 1 MB
    this.lowWatermarkBytes = config.lowWatermarkBytes ?? 256 * 1024; // 256 KB
    this.maxQueueLength = config.maxQueueLength ?? 500;
  }

  public enqueue(message: WebSocketMessageEnvelope): boolean {
    const msgBytes =
      typeof message.payload === "string"
        ? new TextEncoder().encode(message.payload).length
        : message.payload.byteLength;

    // Check if backpressure threshold will be reached
    const reachedLimit =
      this.queuedBytes + msgBytes >= this.highWatermarkBytes ||
      this.queue.length >= this.maxQueueLength;

    if (reachedLimit) {
      this.isPaused = true;
    }

    if (this.isPaused) {
      // If message is marked droppable, drop it immediately
      if (message.isDroppable) {
        this.droppedCount++;
        return false;
      }
      // If queue has reached hard limit (1.2x maxQueueLength), even non-droppable must reject to prevent OOM
      if (this.queue.length >= Math.floor(this.maxQueueLength * 1.2)) {
        this.droppedCount++;
        return false;
      }
    }

    this.queue.push(message);
    this.queuedBytes += msgBytes;

    if (
      this.queue.length >= this.maxQueueLength ||
      this.queuedBytes >= this.highWatermarkBytes
    ) {
      this.isPaused = true;
    }

    return true;
  }

  public drain(maxBatch = 50): WebSocketMessageEnvelope[] {
    if (this.queue.length === 0) return [];

    const batch = this.queue.splice(0, maxBatch);
    let drainedBytes = 0;

    for (const msg of batch) {
      const bytes =
        typeof msg.payload === "string"
          ? new TextEncoder().encode(msg.payload).length
          : msg.payload.byteLength;
      drainedBytes += bytes;
    }

    this.queuedBytes = Math.max(0, this.queuedBytes - drainedBytes);
    this.forwardedCount += batch.length;

    // Check if backpressure can be released
    if (
      this.isPaused &&
      this.queuedBytes <= this.lowWatermarkBytes &&
      this.queue.length <= this.maxQueueLength / 2
    ) {
      this.isPaused = false;
    }

    return batch;
  }

  public getMetrics(): ChannelMetrics {
    return {
      queuedBytes: this.queuedBytes,
      queuedMessages: this.queue.length,
      forwardedMessages: this.forwardedCount,
      droppedMessages: this.droppedCount,
      isBackpressureActive: this.isPaused,
    };
  }

  public clear(): void {
    this.queue = [];
    this.queuedBytes = 0;
    this.isPaused = false;
  }
}
