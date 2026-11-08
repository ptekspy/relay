import { describe, expect, it } from "vitest";
import { TokenBucketRateLimiter } from "./rate-limiter.js";

describe("TokenBucketRateLimiter", () => {
  it("consumes available tokens up to capacity", () => {
    const limiter = new TokenBucketRateLimiter({
      capacity: 3,
      refillRatePerSecond: 1,
    });

    expect(limiter.tryConsume(1)).toBe(true);
    expect(limiter.tryConsume(1)).toBe(true);
    expect(limiter.tryConsume(1)).toBe(true);
    expect(limiter.tryConsume(1)).toBe(false);
  });

  it("resets tokens to full capacity", () => {
    const limiter = new TokenBucketRateLimiter({
      capacity: 5,
      refillRatePerSecond: 2,
    });

    limiter.tryConsume(5);
    expect(limiter.tryConsume(1)).toBe(false);
    limiter.reset();
    expect(limiter.tryConsume(1)).toBe(true);
  });
});
