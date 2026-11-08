import type { SimulationBenchmarkMetrics } from "./types.js";

export class SimulationMetricAggregator {
  private latencies: number[] = [];
  private emitted = 0;
  private delivered = 0;
  private startTime = Date.now();

  public recordEvent(latencyMs: number, delivered = true): void {
    this.emitted++;
    if (delivered) {
      this.delivered++;
      this.latencies.push(latencyMs);
    }
  }

  public computeMetrics(): SimulationBenchmarkMetrics {
    const elapsedSec = Math.max(0.001, (Date.now() - this.startTime) / 1000);
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const count = sorted.length;

    const p50 = count > 0 ? sorted[Math.floor(count * 0.5)] || 0 : 0;
    const p95 = count > 0 ? sorted[Math.floor(count * 0.95)] || 0 : 0;
    const p99 = count > 0 ? sorted[Math.floor(count * 0.99)] || 0 : 0;

    return {
      totalEmittedEvents: this.emitted,
      totalDeliveredEvents: this.delivered,
      droppedEvents: this.emitted - this.delivered,
      p50LatencyMs: p50,
      p95LatencyMs: p95,
      p99LatencyMs: p99,
      throughputEventsPerSec: Math.round(this.delivered / elapsedSec),
    };
  }

  public renderMarkdownSummary(): string {
    const m = this.computeMetrics();
    return `
| Metric | Value |
| :--- | :--- |
| **Total Emitted** | ${m.totalEmittedEvents} |
| **Total Delivered** | ${m.totalDeliveredEvents} |
| **Dropped Events** | ${m.droppedEvents} |
| **p50 Latency** | ${m.p50LatencyMs}ms |
| **p95 Latency** | ${m.p95LatencyMs}ms |
| **p99 Latency** | ${m.p99LatencyMs}ms |
| **Throughput** | ${m.throughputEventsPerSec} events/sec |
`.trim();
  }
}

export const simulationMetricAggregator = new SimulationMetricAggregator();
