import type { PythonTelemetryPayload } from "./types.js";

export class FastApiTraceMiddleware {
  private traces: PythonTelemetryPayload[] = [];

  public recordRequest(trace: PythonTelemetryPayload): void {
    this.traces.push(trace);
    if (this.traces.length > 200) {
      this.traces.shift();
    }
  }

  public getRecentTraces(): PythonTelemetryPayload[] {
    return [...this.traces];
  }

  public calculateAverageLatency(): number {
    if (this.traces.length === 0) return 0;
    const total = this.traces.reduce((acc, t) => acc + t.durationMs, 0);
    return Math.round(total / this.traces.length);
  }
}
