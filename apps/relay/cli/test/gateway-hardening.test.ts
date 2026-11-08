import { describe, expect, it } from "bun:test";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { toReceiverId } from "@paddy-systems/relay-protocol";
import {
  RELAY_COOKIE_NAME,
  RELAY_TOKEN_QUERY,
  startRelayGateway,
} from "../src/gateway.js";
import {
  discoverNetworkInterfaces,
  getPrimaryLanIp,
} from "../src/net-discovery.js";
import { SlidingWindowRateLimiter } from "../src/rate-limiter.js";
import { ReceiverConnectionPool } from "../src/receiver-pool.js";

describe("CLI Gateway Hardening & Streaming", () => {
  it("enforces sliding-window rate limiting on unauthenticated requests", async () => {
    const limiter = new SlidingWindowRateLimiter({
      windowMs: 1000,
      maxRequests: 3,
    });

    const ip = "192.168.1.100";
    expect(limiter.isAllowed(ip)).toBe(true);
    expect(limiter.isAllowed(ip)).toBe(true);
    expect(limiter.isAllowed(ip)).toBe(true);
    // 4th request exceeds maxRequests within window
    expect(limiter.isAllowed(ip)).toBe(false);

    // Another IP is unhampered
    expect(limiter.isAllowed("192.168.1.101")).toBe(true);
  });

  it("manages multi-receiver pool and tracks active devices", () => {
    const pool = new ReceiverConnectionPool({ maxReceivers: 2 });

    expect(
      pool.register({
        id: toReceiverId("rec_1"),
        ip: "192.168.1.50",
        userAgent: "Android Tablet",
        connectedAt: Date.now(),
        lastActiveAt: Date.now(),
      }),
    ).toBe(true);

    expect(
      pool.register({
        id: toReceiverId("rec_2"),
        ip: "192.168.1.51",
        userAgent: "iPhone Safari",
        connectedAt: Date.now(),
        lastActiveAt: Date.now(),
      }),
    ).toBe(true);

    // 3rd receiver should be rejected if pool full
    expect(
      pool.register({
        id: toReceiverId("rec_3"),
        ip: "192.168.1.52",
        userAgent: "Chrome Desktop",
        connectedAt: Date.now(),
        lastActiveAt: Date.now(),
      }),
    ).toBe(false);

    expect(pool.count).toBe(2);
    expect(pool.remove("rec_1")).toBe(true);
    expect(pool.count).toBe(1);
  });

  it("discovers network interfaces and resolves primary LAN IP", () => {
    const interfaces = discoverNetworkInterfaces();
    expect(Array.isArray(interfaces)).toBe(true);

    const primaryIp = getPrimaryLanIp();
    expect(typeof primaryIp).toBe("string");
    expect(primaryIp.length).toBeGreaterThan(0);
  });

  it("gateway enforces rate limiting and tracks receiver in real HTTP traffic", async () => {
    // 1. Mock upstream dev server
    const upstreamServer = createServer((_, res) => {
      res.writeHead(200, { "content-type": "text/plain" });
      res.end("UPSTREAM_OK");
    });

    await new Promise<void>((resolve) =>
      upstreamServer.listen(0, "127.0.0.1", resolve),
    );
    const upstreamPort = (upstreamServer.address() as AddressInfo).port;

    const token = "secure-hardening-token-12345";
    const gateway = await startRelayGateway({
      targetPort: upstreamPort,
      sessionToken: token,
      preferredPort: 18400,
      maxRequestsPerMinute: 5,
    });

    try {
      // Unauthenticated spam to test HTTP 429
      for (let i = 0; i < 5; i++) {
        const res = await fetch(`http://127.0.0.1:${gateway.port}/`);
        expect(res.status).toBe(401);
      }

      // 6th unauthenticated request should be rate-limited
      const rateLimitedRes = await fetch(`http://127.0.0.1:${gateway.port}/`);
      expect(rateLimitedRes.status).toBe(429);

      // Authenticated pairing request with query token
      const authRes = await fetch(
        `http://127.0.0.1:${gateway.port}/?${RELAY_TOKEN_QUERY}=${token}`,
        {
          redirect: "manual",
          headers: { "user-agent": "Android-Test-Tablet" },
        },
      );
      expect(authRes.status).toBe(302);
      expect(authRes.headers.get("location")).toBe("/");
      const cookie = authRes.headers.get("set-cookie");
      expect(cookie).toContain(RELAY_COOKIE_NAME);

      // Verify device was registered into receiver pool
      expect(gateway.receiverPool.count).toBeGreaterThan(0);
    } finally {
      await gateway.close();
      await new Promise<void>((resolve) =>
        upstreamServer.close(() => resolve()),
      );
    }
  });
});
