import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createServer } from "node:http";
import { RelayWebpackPlugin } from "@paddy-systems/relay-integrations";
import { RelayE2EContractRunner } from "@paddy-systems/relay-testing";

describe("Webpack 5 SPA & Relay Integration E2E Contract", () => {
  let webpackServer: ReturnType<typeof createServer>;
  let webpackPort: number;
  let relayServer: ReturnType<typeof createServer>;
  let relayPort: number;

  beforeAll(async () => {
    // 1. Webpack DevServer simulation
    webpackServer = createServer((req, res) => {
      if (req.url === "/api/test-echo" && req.method === "POST") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ webpack: true }));
        return;
      }

      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(`<!doctype html>
<html>
  <head>
    <title>Webpack 5 React 19 SPA</title>
    <script src="/agent.js"></script>
    <script src="/main.js"></script>
  </head>
  <body>
    <div id="root">
      <h1>Webpack 5 DevServer SPA</h1>
    </div>
  </body>
</html>`);
    });

    await new Promise<void>((resolve) => {
      webpackServer.listen(0, "127.0.0.1", () => {
        const addr = webpackServer.address();
        if (typeof addr === "object" && addr) webpackPort = addr.port;
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

      const upstream = await fetch(
        `http://127.0.0.1:${webpackPort}${req.url}`,
        {
          method: req.method,
          headers: req.headers as Record<string, string>,
          body:
            req.method !== "GET" && req.method !== "HEAD"
              ? bodyBuffer
              : undefined,
          redirect: "manual",
        },
      );

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
      new Promise<void>((r) => webpackServer.close(() => r())),
      new Promise<void>((r) => relayServer.close(() => r())),
    ]);
  });

  it("passes full Relay E2E Contract across Webpack 5 DevServer SPA", async () => {
    const plugin = new RelayWebpackPlugin({
      relayHost: `http://127.0.0.1:${relayPort}`,
      targetPort: webpackPort,
    });

    const patchedConfig = plugin.patchDevServerConfig({
      allowedHosts: "auto",
      client: {
        webSocketURL: {
          hostname: "localhost",
          port: webpackPort,
          pathname: "/ws",
        },
      },
    });

    const report = await RelayE2EContractRunner.runContract({
      frameworkName: "webpack-spa",
      targetPort: webpackPort,
      relayPort,
      isHtmlApp: true,
      hmrPath: "/ws",
      customFrameworkCheck: async () => {
        const allowed = patchedConfig.allowedHosts === "all";
        const socketPath =
          patchedConfig.client?.webSocketURL?.pathname === "/ws";
        return {
          pass: allowed && socketPath,
          detail: `allowedHosts=${patchedConfig.allowedHosts}, socket=${patchedConfig.client?.webSocketURL?.pathname}`,
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
