import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createServer } from "node:http";
import { NextJsServerActionsNormalizer } from "@paddy-systems/relay-integrations";
import { RelayE2EContractRunner } from "@paddy-systems/relay-testing";

describe("Next.js 15 App Router & Server Actions Relay E2E Contract", () => {
  let nextServer: ReturnType<typeof createServer>;
  let nextPort: number;
  let relayServer: ReturnType<typeof createServer>;
  let relayPort: number;

  beforeAll(async () => {
    // 1. Next.js mock dev server verifying Server Actions & CSRF
    nextServer = createServer((req, res) => {
      // Server Actions endpoint check
      if (req.method === "POST" && req.headers["next-action"]) {
        const origin = req.headers.origin;
        const host = req.headers.host;

        // Next.js App Router rejects cross-origin action requests unless host/origin match localhost
        if (
          origin !== `http://localhost:${nextPort}` ||
          host !== `localhost:${nextPort}`
        ) {
          res.writeHead(403, { "content-type": "text/plain" });
          res.end("CSRF verification failed: Origin/Host mismatch");
          return;
        }

        res.writeHead(303, {
          location: `http://localhost:${nextPort}/success`,
          "content-type": "text/x-component",
        });
        res.end('0:["$","$L1",null,{"status":"action-executed"}]\n');
        return;
      }

      if (req.url === "/api/test-echo" && req.method === "POST") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ echo: true }));
        return;
      }

      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(`<!doctype html>
<html>
  <head>
    <title>Next.js App Router</title>
    <script src="/agent.js"></script>
  </head>
  <body>
    <h1>Next.js 15 Server Actions</h1>
    <form action="/action" method="POST">
      <input name="message" value="test" />
      <button type="submit">Submit</button>
    </form>
  </body>
</html>`);
    });

    await new Promise<void>((resolve) => {
      nextServer.listen(0, "127.0.0.1", () => {
        const addr = nextServer.address();
        if (typeof addr === "object" && addr) nextPort = addr.port;
        resolve();
      });
    });

    // 2. Relay Reverse Proxy Gateway for Next.js
    relayServer = createServer(async (req, res) => {
      // Normalize headers from mobile/tunnel client to Next.js dev server
      const normalizedHeaders =
        NextJsServerActionsNormalizer.normalizeRequestHeaders(
          req.headers as Record<string, string>,
          {
            localDevHost: `localhost:${nextPort}`,
            localDevOrigin: `http://localhost:${nextPort}`,
          },
        );

      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const bodyBuffer = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

      const upstream = await fetch(`http://127.0.0.1:${nextPort}${req.url}`, {
        method: req.method,
        headers: normalizedHeaders,
        body:
          req.method !== "GET" && req.method !== "HEAD"
            ? bodyBuffer
            : undefined,
        redirect: "manual",
      });

      const responseHeaders =
        NextJsServerActionsNormalizer.normalizeResponseHeaders(
          Object.fromEntries(upstream.headers.entries()),
          {
            relayHost: `127.0.0.1:${relayPort}`,
            relayOrigin: `http://127.0.0.1:${relayPort}`,
          },
        );

      res.writeHead(upstream.status, responseHeaders);
      const buf = await upstream.arrayBuffer();
      res.end(Buffer.from(buf));
    });

    await new Promise<void>((resolve) => {
      relayServer.listen(0, "127.0.0.1", () => {
        const addr = relayServer.address();
        if (typeof addr === "object" && addr) relayPort = addr.port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await Promise.all([
      new Promise<void>((r) => nextServer.close(() => r())),
      new Promise<void>((r) => relayServer.close(() => r())),
    ]);
  });

  it("passes full Relay E2E Contract across Next.js 15 with Server Actions normalization", async () => {
    const report = await RelayE2EContractRunner.runContract({
      frameworkName: "nextjs",
      targetPort: nextPort,
      relayPort,
      isHtmlApp: true,
      hmrPath: "/_next/webpack-hmr",
      customFrameworkCheck: async ({ relayBaseUrl }) => {
        // Send a Next.js Server Action over Relay tunnel
        const actionRes = await fetch(`${relayBaseUrl}/action`, {
          method: "POST",
          headers: {
            "next-action": "submitFeedback-id-hash",
            origin: relayBaseUrl,
            host: `127.0.0.1:${relayPort}`,
          },
          redirect: "manual",
        });

        // Must succeed without 403 CSRF error, and redirect location rewritten to relay tunnel
        const pass = actionRes.status === 303;
        const location = actionRes.headers.get("location");
        const locationOk = location ? location.startsWith(relayBaseUrl) : false;

        return {
          pass: pass && locationOk,
          detail: `status=${actionRes.status}, location=${location}`,
        };
      },
    });

    expect(report.allPassed).toBe(true);
    expect(report.checks.httpGet).toBe(true);
    expect(report.checks.httpPost).toBe(true);
    expect(report.checks.agentInjection).toBe(true);
    expect(report.checks.frameworkSpecific).toBe(true);
  });
});
