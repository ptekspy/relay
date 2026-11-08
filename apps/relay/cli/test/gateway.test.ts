import { describe, expect, it } from "bun:test";
import { createServer } from "node:http";
import { startRelayGateway } from "../src/gateway.js";

describe("Relay Gateway", () => {
  it("authenticates via token and proxies HTTP requests", async () => {
    // 1. Mock local dev target server
    const targetServer = createServer((req, res) => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, echoPath: req.url }));
    });

    await new Promise<void>((resolve) =>
      targetServer.listen(9876, "127.0.0.1", resolve),
    );

    // 2. Start Gateway
    const gateway = await startRelayGateway({
      targetPort: 9876,
      sessionToken: "secret-test-token-123",
      preferredPort: 7339,
    });

    try {
      // 3. Unauthenticated request -> 401
      const unauthRes = await fetch(`http://127.0.0.1:${gateway.port}/test`);
      expect(unauthRes.status).toBe(401);

      // 4. Initial pairing request with query token -> 302 redirect with session cookie
      const pairRes = await fetch(
        `http://127.0.0.1:${gateway.port}/test?relay_token=secret-test-token-123`,
        { redirect: "manual" },
      );
      expect(pairRes.status).toBe(302);
      const setCookie = pairRes.headers.get("set-cookie");
      expect(setCookie).toContain("__relay_session=secret-test-token-123");
      expect(pairRes.headers.get("location")).toBe("/test");

      // 5. Authenticated request with session cookie -> 200 Proxied
      const proxiedRes = await fetch(
        `http://127.0.0.1:${gateway.port}/hello-world`,
        {
          headers: {
            cookie: "__relay_session=secret-test-token-123",
          },
        },
      );
      expect(proxiedRes.status).toBe(200);
      const data = await proxiedRes.json();
      expect(data).toEqual({ ok: true, echoPath: "/hello-world" });
    } finally {
      await gateway.close();
      await new Promise<void>((resolve) => targetServer.close(() => resolve()));
    }
  });
});
