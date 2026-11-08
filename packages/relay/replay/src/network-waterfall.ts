import type { NetworkTelemetryEvent } from "@paddy-systems/relay-protocol";
import type { NetworkRequestReplayItem } from "./types.js";

/**
 * Synchronizes network telemetry events and reconstructs waterfall timing states.
 */
export class NetworkWaterfallSynchronizer {
  private requests: Map<string, NetworkRequestReplayItem> = new Map();

  public ingest(events: NetworkTelemetryEvent[]): void {
    for (const evt of events) {
      const id = `${evt.method}:${evt.url}:${evt.timestamp}`;
      const isFailed = evt.status >= 400 || !!evt.error;

      this.requests.set(id, {
        id,
        url: evt.url,
        method: evt.method,
        status: evt.status,
        startTime: evt.timestamp,
        durationMs: evt.durationMs,
        sizeBytes: evt.sizeBytes,
        error: evt.error,
        state: isFailed ? "failed" : "completed",
      });
    }
  }

  public getWaterfallStateAt(currentTime: number): NetworkRequestReplayItem[] {
    const result: NetworkRequestReplayItem[] = [];

    for (const req of this.requests.values()) {
      if (currentTime < req.startTime) {
        continue; // hasn't started yet
      }

      const finishTime = req.startTime + req.durationMs;
      if (currentTime >= finishTime) {
        result.push({ ...req });
      } else {
        // In flight at this time
        result.push({
          ...req,
          state: "pending",
        });
      }
    }

    return result.sort((a, b) => a.startTime - b.startTime);
  }

  public getAllRequests(): NetworkRequestReplayItem[] {
    return Array.from(this.requests.values()).sort(
      (a, b) => a.startTime - b.startTime,
    );
  }
}
