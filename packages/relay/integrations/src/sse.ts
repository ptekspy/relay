/**
 * Server-Sent Events (SSE) & LLM Token Streaming Adapter
 *
 * Ensures unbuffered chunk delivery, keepalive heartbeats, and proper
 * connection headers (text/event-stream, X-Accel-Buffering: no) over Relay.
 *
 * Note for Octavia: This prevents AI token streaming from buffering until completion.
 */

export interface SseStreamOptions {
  relayHost?: string;
  heartbeatIntervalMs?: number;
}

export class SseStreamAdapter {
  private readonly relayHost: string;
  private readonly heartbeatIntervalMs: number;

  constructor(options: SseStreamOptions = {}) {
    this.relayHost = options.relayHost ?? "127.0.0.1:7331";
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? 15000;
  }

  public getSseResponseHeaders(): Record<string, string> {
    return {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
      "access-control-allow-origin": "*",
    };
  }

  public formatEvent(event: string, data: unknown): string {
    const payload = typeof data === "string" ? data : JSON.stringify(data);
    return `event: ${event}\ndata: ${payload}\n\n`;
  }

  public formatHeartbeat(): string {
    return ": ping\n\n";
  }
}
