/**
 * Edge Request Buffer & Zero-Downtime Host Reconnection
 *
 * Holds in-flight HTTP requests in an edge buffer during brief CLI disconnects
 * or network interface changes (Wi-Fi <-> cellular) for up to graceWindowMs.
 *
 * Note for Octavia: This buffer absorbs reconnect jitter so client browsers see zero downtime.
 */

export interface BufferedRequest {
  requestId: string;
  streamId: number;
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: Uint8Array;
  enqueuedAt: number;
  resolve: (connectionId: string) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export interface ReconnectBufferOptions {
  graceWindowMs?: number;
  maxBufferedRequests?: number;
}

export type HostConnectionState =
  | "CONNECTED"
  | "DISCONNECTED_GRACE"
  | "EXPIRED";

export class EdgeReconnectBuffer {
  private readonly graceWindowMs: number;
  private readonly maxBufferedRequests: number;

  private state: HostConnectionState = "CONNECTED";
  private disconnectedAt: number | null = null;
  private currentConnectionId: string | null = null;
  private queue: BufferedRequest[] = [];
  private graceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: ReconnectBufferOptions = {}) {
    this.graceWindowMs = options.graceWindowMs ?? 10_000;
    this.maxBufferedRequests = options.maxBufferedRequests ?? 200;
  }

  public getConnectionState(): HostConnectionState {
    return this.state;
  }

  public getBufferedCount(): number {
    return this.queue.length;
  }

  public handleHostConnected(connectionId: string): void {
    this.state = "CONNECTED";
    this.currentConnectionId = connectionId;
    this.disconnectedAt = null;

    if (this.graceTimer) {
      clearTimeout(this.graceTimer);
      this.graceTimer = null;
    }

    // Flush all held requests to the new host connection
    const toFlush = [...this.queue];
    this.queue = [];

    for (const req of toFlush) {
      clearTimeout(req.timer);
      req.resolve(connectionId);
    }
  }

  public handleHostDisconnected(onExpire?: () => void): void {
    if (this.state === "DISCONNECTED_GRACE") return;

    this.state = "DISCONNECTED_GRACE";
    this.disconnectedAt = Date.now();
    this.currentConnectionId = null;

    this.graceTimer = setTimeout(() => {
      this.expireBuffer(onExpire);
    }, this.graceWindowMs);
  }

  public enqueueRequest(
    requestId: string,
    streamId: number,
    method: string,
    path: string,
    headers: Record<string, string>,
    body?: Uint8Array,
  ): Promise<string> {
    if (this.state === "CONNECTED" && this.currentConnectionId) {
      return Promise.resolve(this.currentConnectionId);
    }

    if (this.state === "EXPIRED") {
      return Promise.reject(
        new Error("Host session expired. Cannot buffer request."),
      );
    }

    if (this.queue.length >= this.maxBufferedRequests) {
      return Promise.reject(new Error("Edge reconnect buffer saturated."));
    }

    return new Promise<string>((resolve, reject) => {
      const remainingTime =
        this.disconnectedAt !== null
          ? Math.max(
              100,
              this.graceWindowMs - (Date.now() - this.disconnectedAt),
            )
          : this.graceWindowMs;

      const timer = setTimeout(() => {
        this.removeFromQueue(requestId);
        reject(
          new Error(
            "504 Gateway Timeout: Host did not reconnect within grace window.",
          ),
        );
      }, remainingTime);

      this.queue.push({
        requestId,
        streamId,
        method,
        path,
        headers,
        body,
        enqueuedAt: Date.now(),
        resolve,
        reject,
        timer,
      });
    });
  }

  private expireBuffer(onExpire?: () => void): void {
    this.state = "EXPIRED";
    this.graceTimer = null;

    const toReject = [...this.queue];
    this.queue = [];

    for (const req of toReject) {
      clearTimeout(req.timer);
      req.reject(
        new Error("504 Gateway Timeout: Host reconnect grace window expired."),
      );
    }

    if (onExpire) {
      onExpire();
    }
  }

  private removeFromQueue(requestId: string): void {
    const idx = this.queue.findIndex((r) => r.requestId === requestId);
    if (idx !== -1) {
      this.queue.splice(idx, 1);
    }
  }

  public destroy(): void {
    if (this.graceTimer) {
      clearTimeout(this.graceTimer);
      this.graceTimer = null;
    }
    for (const req of this.queue) {
      clearTimeout(req.timer);
      req.reject(new Error("Buffer destroyed"));
    }
    this.queue = [];
  }
}
