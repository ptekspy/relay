export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
}

export class SlidingWindowRateLimiter {
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly hits: Map<string, number[]> = new Map();

  constructor(options: RateLimiterOptions) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
  }

  /**
   * Checks whether the client identifier (e.g. IP) is allowed.
   * If allowed, records the hit and returns true.
   * If exceeded, returns false.
   */
  isAllowed(clientId: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let timestamps = this.hits.get(clientId);
    if (!timestamps) {
      timestamps = [];
      this.hits.set(clientId, timestamps);
    }

    // Filter out timestamps outside the active window
    const validTimestamps = timestamps.filter((t) => t > windowStart);

    if (validTimestamps.length >= this.maxRequests) {
      this.hits.set(clientId, validTimestamps);
      return false;
    }

    validTimestamps.push(now);
    this.hits.set(clientId, validTimestamps);
    return true;
  }

  /**
   * Resets hit count for a client.
   */
  reset(clientId: string): void {
    this.hits.delete(clientId);
  }

  /**
   * Periodic cleanup of expired client entries to prevent memory leaks.
   */
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [clientId, timestamps] of this.hits.entries()) {
      const active = timestamps.filter((t) => t > windowStart);
      if (active.length === 0) {
        this.hits.delete(clientId);
      } else {
        this.hits.set(clientId, active);
      }
    }
  }
}
