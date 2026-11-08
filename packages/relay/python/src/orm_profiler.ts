import type { SqlQueryTelemetry } from "./types.js";

export class OrmQueryProfiler {
  private queries: SqlQueryTelemetry[] = [];
  private slowQueryThresholdMs = 50;

  constructor(slowQueryThresholdMs = 50) {
    this.slowQueryThresholdMs = slowQueryThresholdMs;
  }

  public recordQuery(query: SqlQueryTelemetry): void {
    this.queries.push(query);
  }

  public getSlowQueries(): SqlQueryTelemetry[] {
    return this.queries.filter(
      (q) => q.durationMs >= this.slowQueryThresholdMs,
    );
  }

  public detectPotentialNPlusOne(): { count: number; samplePattern?: string } {
    const patterns = new Map<string, number>();

    for (const q of this.queries) {
      // Normalize query parameters (e.g. SELECT * FROM users WHERE id = ?)
      const normalized = q.query.replace(/\d+/g, "?").replace(/'[^']*'/g, "?");
      const count = (patterns.get(normalized) || 0) + 1;
      patterns.set(normalized, count);
    }

    let maxCount = 0;
    let worstPattern: string | undefined;

    for (const [pattern, count] of patterns.entries()) {
      if (count > maxCount) {
        maxCount = count;
        worstPattern = pattern;
      }
    }

    return {
      count: maxCount,
      samplePattern: maxCount >= 3 ? worstPattern : undefined,
    };
  }

  public getAllQueries(): SqlQueryTelemetry[] {
    return [...this.queries];
  }
}
