import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createServer } from "node:http";
import { defineRelayNuxtModule } from "@paddy-systems/relay-integrations";
import { RelayE2EContractRunner } from "@paddy-systems/relay-testing";

describe("Nuxt 3 Nitro & Relay Integration E2E Contract", () => {
  let nuxtServer: ReturnType<typeof createServer>;
  let nuxtPort: number;
  let relayServer: ReturnType<typeof createServer>;
  let relayPort: number;

  beforeAll(async () => {
    // 1. Nuxt 3 Nitro dev server simulation with SSR chunked streaming
    nuxtServer = createServer((req, res) => {
      if (req.url === "/api/test-echo" && req.method === "POST") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ nitro: true }));
        return;
      }

      // Nuxt SSR HTML streaming response
      res.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "transfer-encoding": "chunked",
      });
      res.write("<!doctype html><html><head><title>Nuxt 3 App</title>");
      res.write('<script src="/agent.js"></script></head>');
      res.write(
        '<body><div id="__nuxt"><h1>Nuxt 3 Nitro Engine</h1></div></body></html>',
      );
      res.end();
    });

    await new Promise<void>((resolve) => {
      nuxtServer.listen(0, "127.0.0.1", () => {
        const addr = nuxtServer.address();
        if (typeof addr === "object" && addr) nuxtPort = addr.port;
        resolve();
      });
    });

    // 2. Relay Gateway with Nuxt Module verification
    relayServer = createServer(async (req, res) => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const bodyBuffer = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

      const upstream = await fetch(`http://127.0.0.1:${nuxtPort}${req.url}`, {
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
      new Promise<void>((r) => nuxtServer.close(() => r())),
      new Promise<void>((r) => relayServer.close(() => r())),
    ]);
  });

  it("passes full Relay E2E Contract across Nuxt 3 Nitro dev server", async () => {
    const nuxtModule = defineRelayNuxtModule({
      port: nuxtPort,
      relayHost: `http://127.0.0.1:${relayPort}`,
    });
    const moduleSetup = nuxtModule.setup({}, {});

    const report = await RelayE2EContractRunner.runContract({
      frameworkName: "nuxt",
      targetPort: nuxtPort,
      relayPort,
      isHtmlApp: true,
      hmrPath: "/_nuxt/hmr",
      customFrameworkCheck: async () => {
        return {
          pass:
            moduleSetup.pairingUrl.includes(String(nuxtPort)) &&
            moduleSetup.isDevOnly,
          detail: `pairingUrl=${moduleSetup.pairingUrl}`,
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
