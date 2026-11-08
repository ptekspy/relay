import type { ReplayEventWrapper } from "./types.js";

/**
 * Deterministic Event Timeline Reconstructor & Sequencer.
 * Orders incoming events monotonically by sequence number and timestamp.
 */
export class ReplayTimeline {
  private events: ReplayEventWrapper[] = [];
  private seenIds = new Set<string>();

  public ingest(events: ReplayEventWrapper[]): void {
    for (const evt of events) {
      if (this.seenIds.has(evt.id)) {
        continue;
      }
      this.seenIds.add(evt.id);
      this.events.push(evt);
    }

    // Sort deterministically: primary by timestamp, secondary by sequenceNumber
    this.events.sort((a, b) => {
      if (a.timestamp !== b.timestamp) {
        return a.timestamp - b.timestamp;
      }
      return a.sequenceNumber - b.sequenceNumber;
    });
  }

  public getEvents(): readonly ReplayEventWrapper[] {
    return this.events;
  }

  public getEventsUpTo(timestamp: number): ReplayEventWrapper[] {
    // Binary search upper bound
    let low = 0;
    let high = this.events.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      const midVal = this.events[mid];
      if (midVal && midVal.timestamp <= timestamp) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    return this.events.slice(0, low);
  }

  public getEventsInRange(
    startTime: number,
    endTime: number,
  ): ReplayEventWrapper[] {
    return this.events.filter(
      (e) => e.timestamp >= startTime && e.timestamp <= endTime,
    );
  }

  public getStartTime(): number {
    return this.events.length > 0 && this.events[0]
      ? this.events[0].timestamp
      : 0;
  }

  public getEndTime(): number {
    return this.events.length > 0 && this.events[this.events.length - 1]
      ? this.events[this.events.length - 1]!.timestamp
      : 0;
  }

  public getDuration(): number {
    const start = this.getStartTime();
    const end = this.getEndTime();
    return Math.max(0, end - start);
  }

  public size(): number {
    return this.events.length;
  }
}
