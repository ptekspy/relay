import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
  RELAY_COOKIE_NAME,
  type RelayGateway,
  startRelayGateway,
} from "../../../apps/relay/cli/src/gateway.js";
import { SlidingWindowRateLimiter } from "../../../apps/relay/cli/src/rate-limiter.js";
import { createMockDevServer, type MockTargetServer } from "./harness";

describe("Journey 08: Gateway Defense & Sliding-Window Rate Limiting (429 Too Many Requests)", () => {
  let targetServer: MockTargetServer;
  let gateway: RelayGateway;
  const sessionToken = "session-rate-limit-token-xyz";

  beforeEach(async () => {
    targetServer = await createMockDevServer();
    // Start gateway with a low threshold (e.g. 5 requests per minute) to test rate limiting
    gateway = await startRelayGateway({
      preferredPort: 7500 + Math.floor(Math.random() * 500),
      targetPort: targetServer.port,
      sessionToken,
      maxRequestsPerMinute: 5,
    });
  });

  afterEach(async () => {
    await gateway.close();
    await targetServer.close();
  });

  it("verifies SlidingWindowRateLimiter algorithm directly", () => {
    const limiter = new SlidingWindowRateLimiter({
      windowMs: 1000,
      maxRequests: 3,
    });

    const client = "192.168.1.50";
    expect(limiter.isAllowed(client)).toBe(true); // 1
    expect(limiter.isAllowed(client)).toBe(true); // 2
    expect(limiter.isAllowed(client)).toBe(true); // 3
    expect(limiter.isAllowed(client)).toBe(false); // 4 (blocked)

    // Other clients should remain unaffected
    expect(limiter.isAllowed("192.168.1.51")).toBe(true);

    // Resetting unblocks client
    limiter.reset(client);
    expect(limiter.isAllowed(client)).toBe(true);
  });

  it("returns 429 Too Many Requests on burst unauthenticated requests and permits authenticated requests", async () => {
    const gatewayUrl = `http://127.0.0.1:${gateway.port}`;

    const statusCodes: number[] = [];
    for (let i = 0; i < 8; i++) {
      const res = await fetch(gatewayUrl);
      statusCodes.push(res.status);
    }

    // First 5 requests should be 401 Unauthorized
    const unauthCount = statusCodes.filter((code) => code === 401).length;
    expect(unauthCount).toBe(5);

    // Subsequent requests should be 429 Too Many Requests
    const rateLimitedCount = statusCodes.filter((code) => code === 429).length;
    expect(rateLimitedCount).toBe(3);

    // Verify 429 response structure
    const limitedRes = await fetch(gatewayUrl);
    expect(limitedRes.status).toBe(429);
    expect(limitedRes.headers.get("retry-after")).toBe("60");
    const limitedBody = await limitedRes.text();
    expect(limitedBody).toContain("Too Many Requests");

    // Authenticated requests must NOT be blocked by the unauthenticated rate limiter
    const authedRes = await fetch(gatewayUrl, {
      headers: {
        cookie: `${RELAY_COOKIE_NAME}=${sessionToken}`,
      },
    });
    expect(authedRes.status).toBe(200);
  });
});
