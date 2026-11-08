import crypto from "node:crypto";

export interface TraceContext {
  traceId: string;
  spanId: string;
  sampled: boolean;
}

export class OpenTelemetryBridge {
  public parseTraceParent(header: string | null): TraceContext {
    if (!header) {
      return this.generateTraceContext();
    }

    // W3C format: version(2)-trace_id(32)-parent_id(16)-trace_flags(2)
    const parts = header.trim().split("-");
    if (
      parts.length < 4 ||
      parts[1]?.length !== 32 ||
      parts[2]?.length !== 16
    ) {
      return this.generateTraceContext();
    }

    return {
      traceId: parts[1],
      spanId: parts[2],
      sampled: parts[3] === "01",
    };
  }

  public generateTraceContext(): TraceContext {
    return {
      traceId: crypto.randomBytes(16).toString("hex"),
      spanId: crypto.randomBytes(8).toString("hex"),
      sampled: true,
    };
  }

  public formatTraceParent(ctx: TraceContext): string {
    const flags = ctx.sampled ? "01" : "00";
    return `00-${ctx.traceId}-${ctx.spanId}-${flags}`;
  }
}

export class PrometheusMetricsRegistry {
  private activeSessions = 0;
  private connectedReceivers = 0;
  private totalBytesTransferred = 0;
  private latencies: number[] = [];

  public recordSessionStarted(): void {
    this.activeSessions += 1;
  }

  public recordSessionEnded(): void {
    this.activeSessions = Math.max(0, this.activeSessions - 1);
  }

  public recordReceiverConnected(): void {
    this.connectedReceivers += 1;
  }

  public recordReceiverDisconnected(): void {
    this.connectedReceivers = Math.max(0, this.connectedReceivers - 1);
  }

  public recordBytesTransferred(bytes: number): void {
    this.totalBytesTransferred += bytes;
  }

  public recordRttLatency(latencySec: number): void {
    this.latencies.push(latencySec);
  }

  public exportMetrics(): string {
    const p99 =
      this.latencies.length > 0
        ? ([...this.latencies].sort((a, b) => a - b)[
            Math.floor(this.latencies.length * 0.99)
          ] ?? 0)
        : 0;

    return [
      "# HELP relay_active_sessions Number of currently active relay sessions",
      "# TYPE relay_active_sessions gauge",
      `relay_active_sessions ${this.activeSessions}`,
      "",
      "# HELP relay_connected_receivers Number of connected preview receiver devices",
      "# TYPE relay_connected_receivers gauge",
      `relay_connected_receivers ${this.connectedReceivers}`,
      "",
      "# HELP relay_tunnel_bytes_total Total tunnel traffic transferred in bytes",
      "# TYPE relay_tunnel_bytes_total counter",
      `relay_tunnel_bytes_total ${this.totalBytesTransferred}`,
      "",
      "# HELP relay_rtt_seconds 99th percentile round-trip latency in seconds",
      "# TYPE relay_rtt_seconds gauge",
      `relay_rtt_seconds ${p99}`,
    ].join("\n");
  }
}
