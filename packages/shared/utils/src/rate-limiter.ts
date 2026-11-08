export interface TokenBucketOptions {
  capacity: number;
  refillRatePerSecond: number;
}

export class TokenBucketRateLimiter {
  private readonly capacity: number;
  private readonly refillRatePerSecond: number;
  private tokens: number;
  private lastRefillTimestamp: number;

  constructor(options: TokenBucketOptions) {
    if (options.capacity <= 0 || options.refillRatePerSecond <= 0) {
      throw new Error(
        "Capacity and refillRatePerSecond must be positive numbers",
      );
    }
    this.capacity = options.capacity;
    this.refillRatePerSecond = options.refillRatePerSecond;
    this.tokens = options.capacity;
    this.lastRefillTimestamp = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefillTimestamp) / 1000;
    if (elapsedSeconds > 0) {
      const addedTokens = elapsedSeconds * this.refillRatePerSecond;
      this.tokens = Math.min(this.capacity, this.tokens + addedTokens);
      this.lastRefillTimestamp = now;
    }
  }

  public tryConsume(cost = 1): boolean {
    this.refill();
    if (this.tokens >= cost) {
      this.tokens -= cost;
      return true;
    }
    return false;
  }

  public getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }

  public reset(): void {
    this.tokens = this.capacity;
    this.lastRefillTimestamp = Date.now();
  }
}
