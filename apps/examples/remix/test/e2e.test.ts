import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createServer } from "node:http";
import { RemixReactRouterAdapter } from "@paddy-systems/relay-integrations";
import { RelayE2EContractRunner } from "@paddy-systems/relay-testing";

describe("Remix / React Router v7 & Relay Integration E2E Contract", () => {
  let remixServer: ReturnType<typeof createServer>;
  let remixPort: number;
  let relayServer: ReturnType<typeof createServer>;
  let relayPort: number;

  beforeAll(async () => {
    // 1. Remix / React Router v7 dev server simulation
    remixServer = createServer((req, res) => {
      // Single fetch / _data loader endpoint
      if (
        req.url?.includes("_data=routes%2F_index") ||
        req.url === "/api/test-echo"
      ) {
        res.writeHead(200, {
          "content-type": "application/json",
          "x-remix-response": "yes",
        });
        res.end(JSON.stringify({ message: "Hello from Remix Loader" }));
        return;
      }

      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(`<!doctype html>
<html>
  <head>
    <title>Remix / React Router v7</title>
    <script src="/agent.js"></script>
  </head>
  <body>
    <div id="root">
      <h1>React Router v7 Data Mode</h1>
    </div>
  </body>
</html>`);
    });

    await new Promise<void>((resolve) => {
      remixServer.listen(0, "127.0.0.1", () => {
        const addr = remixServer.address();
        if (typeof addr === "object" && addr) remixPort = addr.port;
        resolve();
      });
    });

    // 2. Relay Gateway with Remix Adapter
    relayServer = createServer(async (req, res) => {
      const adapter = new RemixReactRouterAdapter({
        relayHost: `127.0.0.1:${relayPort}`,
        relayOrigin: `http://127.0.0.1:${relayPort}`,
      });

      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const bodyBuffer = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

      const upstream = await fetch(`http://127.0.0.1:${remixPort}${req.url}`, {
        method: req.method,
        headers: req.headers as Record<string, string>,
        body:
          req.method !== "GET" && req.method !== "HEAD"
            ? bodyBuffer
            : undefined,
        redirect: "manual",
      });

      const upstreamHeaders = Object.fromEntries(upstream.headers.entries());
      const normalizedHeaders = adapter.normalizeCorsHeaders(
        req.headers.origin as string | undefined,
        upstreamHeaders,
      );

      res.writeHead(upstream.status, normalizedHeaders);
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
      new Promise<void>((r) => remixServer.close(() => r())),
      new Promise<void>((r) => relayServer.close(() => r())),
    ]);
  });

  it("passes full Relay E2E Contract across Remix / React Router v7 with single-fetch normalization", async () => {
    const adapter = new RemixReactRouterAdapter({
      relayHost: `127.0.0.1:${relayPort}`,
      relayOrigin: `http://127.0.0.1:${relayPort}`,
    });

    const report = await RelayE2EContractRunner.runContract({
      frameworkName: "remix",
      targetPort: remixPort,
      relayPort,
      isHtmlApp: true,
      hmrPath: "/__manifest",
      customFrameworkCheck: async ({ relayBaseUrl }) => {
        const res = await fetch(`${relayBaseUrl}/?_data=routes%2F_index`, {
          headers: {
            origin: relayBaseUrl,
            accept: "application/x-remix-response",
          },
        });

        const isRemixData = adapter.isRemixDataRequest(
          "/?_data=routes%2F_index",
          { accept: "application/x-remix-response" },
        );

        const data = (await res.json()) as { message: string };
        const pass = isRemixData && data.message.includes("Remix Loader");

        return {
          pass,
          detail: `loader response: ${data.message}`,
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
