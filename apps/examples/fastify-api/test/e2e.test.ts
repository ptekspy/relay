import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createServer } from "node:http";
import { FastifyRelayAdapter } from "@paddy-systems/relay-integrations";
import { RelayE2EContractRunner } from "@paddy-systems/relay-testing";
import type { FastifyInstance } from "fastify";
import { buildServer } from "../src/server";

describe("Fastify REST API & Relay Integration E2E Contract", () => {
  let fastifyApp: FastifyInstance;
  let fastifyPort: number;
  let relayServer: ReturnType<typeof createServer>;
  let relayPort: number;

  beforeAll(async () => {
    // 1. Start Fastify server
    fastifyApp = buildServer();
    const address = await fastifyApp.listen({ port: 0, host: "127.0.0.1" });
    const url = new URL(address);
    fastifyPort = Number(url.port);

    // 2. Start Relay Gateway proxy
    const adapter = new FastifyRelayAdapter({
      relayHost: `127.0.0.1:${fastifyPort}`,
      enableTrustProxy: true,
    });

    relayServer = createServer(async (req, res) => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const bodyBuffer = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

      const normalizedHeaders = adapter.normalizeHeaders(req.headers);

      const upstream = await fetch(
        `http://127.0.0.1:${fastifyPort}${req.url}`,
        {
          method: req.method,
          headers: normalizedHeaders,
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
      fastifyApp.close(),
      new Promise<void>((r) => relayServer.close(() => r())),
    ]);
  });

  it("passes full Relay E2E Contract across Fastify backend REST API", async () => {
    const report = await RelayE2EContractRunner.runContract({
      frameworkName: "fastify-api",
      targetPort: fastifyPort,
      relayPort,
      isHtmlApp: false, // Non-frontend REST API
      customFrameworkCheck: async ({ relayBaseUrl }) => {
        const res = await fetch(`${relayBaseUrl}/health`);
        const json = (await res.json()) as {
          status: string;
          framework: string;
        };
        const itemsRes = await fetch(`${relayBaseUrl}/api/items`);
        const itemsJson = (await itemsRes.json()) as {
          items: Array<{ id: number; name: string }>;
        };

        const pass =
          res.status === 200 &&
          json.status === "ok" &&
          json.framework === "fastify" &&
          itemsJson.items.length === 2;

        return {
          pass,
          detail: `Fastify health: ${json.status}, items count: ${itemsJson.items.length}`,
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
