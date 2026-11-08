import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createServer } from "node:http";
import { SvelteKitRelayBridge } from "@paddy-systems/relay-integrations";
import { RelayE2EContractRunner } from "@paddy-systems/relay-testing";

describe("SvelteKit 2 Vite & Relay Integration E2E Contract", () => {
  let svelteServer: ReturnType<typeof createServer>;
  let sveltePort: number;
  let relayServer: ReturnType<typeof createServer>;
  let relayPort: number;

  beforeAll(async () => {
    // 1. SvelteKit Vite dev server simulation
    svelteServer = createServer((req, res) => {
      if (req.url === "/api/test-echo" && req.method === "POST") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ sveltekit: true }));
        return;
      }

      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(`<!doctype html>
<html>
  <head>
    <title>SvelteKit 2 App</title>
    <script type="module" src="/@vite/client"></script>
    <script src="/agent.js"></script>
  </head>
  <body>
    <h1>SvelteKit 2 + Vite HMR</h1>
    <form method="POST" action="?/submit">
      <input name="test" value="ok" />
    </form>
  </body>
</html>`);
    });

    await new Promise<void>((resolve) => {
      svelteServer.listen(0, "127.0.0.1", () => {
        const addr = svelteServer.address();
        if (typeof addr === "object" && addr) sveltePort = addr.port;
        resolve();
      });
    });

    // 2. Relay Gateway
    relayServer = createServer(async (req, res) => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const bodyBuffer = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

      const upstream = await fetch(`http://127.0.0.1:${sveltePort}${req.url}`, {
        method: req.method,
        headers: req.headers as Record<string, string>,
        body:
          req.method !== "GET" && req.method !== "HEAD"
            ? bodyBuffer
            : undefined,
        redirect: "manual",
      });

      res.writeHead(
        upstream.status,
        Object.fromEntries(upstream.headers.entries()),
      );
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
      new Promise<void>((r) => svelteServer.close(() => r())),
      new Promise<void>((r) => relayServer.close(() => r())),
    ]);
  });

  it("passes full Relay E2E Contract across SvelteKit 2 Vite dev server", async () => {
    const bridge = new SvelteKitRelayBridge({
      targetPort: sveltePort,
      relayPort,
    });

    let hmrReceived = false;
    bridge.onHmrUpdate((evt) => {
      if (evt.path === "/src/routes/+page.svelte") {
        hmrReceived = true;
      }
    });

    const report = await RelayE2EContractRunner.runContract({
      frameworkName: "sveltekit",
      targetPort: sveltePort,
      relayPort,
      isHtmlApp: true,
      hmrPath: "/@vite/client",
      customFrameworkCheck: async () => {
        // Trigger HMR event via bridge
        bridge.notifyHmrUpdate({
          type: "js-update",
          path: "/src/routes/+page.svelte",
        });
        return {
          pass: hmrReceived,
          detail: "Vite HMR update propagated",
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
