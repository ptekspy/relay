export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
}

export class CloudApiRateLimiter {
  private hits = new Map<string, number[]>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(options: RateLimiterOptions) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
  }

  public isAllowed(key: string): boolean {
    const now = Date.now();
    const timestamps = this.hits.get(key) ?? [];
    const recent = timestamps.filter((t) => now - t < this.windowMs);

    if (recent.length >= this.maxRequests) {
      return false;
    }

    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }

  public reset(): void {
    this.hits.clear();
  }
}

export const defaultApiRateLimiter = new CloudApiRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 120, // 120 requests per minute per IP
});
