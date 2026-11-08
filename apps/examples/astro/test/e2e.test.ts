import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createServer } from "node:http";
import { relayAstro } from "@paddy-systems/relay-integrations";
import { RelayE2EContractRunner } from "@paddy-systems/relay-testing";

describe("Astro 5 Islands & Relay Integration E2E Contract", () => {
  let astroServer: ReturnType<typeof createServer>;
  let astroPort: number;
  let relayServer: ReturnType<typeof createServer>;
  let relayPort: number;

  beforeAll(async () => {
    // 1. Astro dev server simulation with Islands and View Transitions
    astroServer = createServer((req, res) => {
      if (req.url === "/api/test-echo" && req.method === "POST") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ astro: true }));
        return;
      }

      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(`<!doctype html>
<html>
  <head>
    <title>Astro 5 Islands App</title>
    <script src="/agent.js"></script>
    <meta name="astro-view-transitions-enabled" content="true" />
  </head>
  <body>
    <h1>Astro 5 Islands & View Transitions</h1>
    <astro-island uid="island-1" component-url="/Island.js"></astro-island>
  </body>
</html>`);
    });

    await new Promise<void>((resolve) => {
      astroServer.listen(0, "127.0.0.1", () => {
        const addr = astroServer.address();
        if (typeof addr === "object" && addr) astroPort = addr.port;
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

      const upstream = await fetch(`http://127.0.0.1:${astroPort}${req.url}`, {
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
      new Promise<void>((r) => astroServer.close(() => r())),
      new Promise<void>((r) => relayServer.close(() => r())),
    ]);
  });

  it("passes full Relay E2E Contract across Astro 5 dev server and View Transitions", async () => {
    const integration = relayAstro({
      relayHost: `http://127.0.0.1:${relayPort}`,
      syncViewTransitions: true,
    });

    let injectedContent = "";
    integration.hooks["astro:config:setup"]?.({
      injectScript: (_stage, content) => {
        injectedContent = content;
      },
      updateConfig: () => {},
    });

    const report = await RelayE2EContractRunner.runContract({
      frameworkName: "astro",
      targetPort: astroPort,
      relayPort,
      isHtmlApp: true,
      hmrPath: "/_astro_hmr",
      customFrameworkCheck: async () => {
        return {
          pass: injectedContent.includes("astro:after-swap"),
          detail: "Astro View Transitions hook verified",
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
