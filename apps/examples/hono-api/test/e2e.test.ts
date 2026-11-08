import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createServer } from "node:http";
import { serve } from "@hono/node-server";
import { HonoRelayAdapter } from "@paddy-systems/relay-integrations";
import { RelayE2EContractRunner } from "@paddy-systems/relay-testing";
import { buildApp } from "../src/server";

describe("Hono Edge & Node API & Relay Integration E2E Contract", () => {
  let honoServer: ReturnType<typeof serve>;
  let honoPort: number;
  let relayServer: ReturnType<typeof createServer>;
  let relayPort: number;

  beforeAll(async () => {
    // 1. Start Hono node server
    const app = buildApp();
    await new Promise<void>((resolve) => {
      honoServer = serve({ fetch: app.fetch, port: 0 }, (info) => {
        honoPort = info.port;
        resolve();
      });
    });

    // 2. Start Relay Gateway proxy
    const adapter = new HonoRelayAdapter({
      relayHost: `127.0.0.1:${honoPort}`,
      cors: true,
    });

    relayServer = createServer(async (req, res) => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const bodyBuffer = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

      const normalizedHeaders = adapter.normalizeHeaders(req.headers);

      const upstream = await fetch(`http://127.0.0.1:${honoPort}${req.url}`, {
        method: req.method,
        headers: normalizedHeaders,
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
      new Promise<void>((r) => honoServer.close(() => r())),
      new Promise<void>((r) => relayServer.close(() => r())),
    ]);
  });

  it("passes full Relay E2E Contract across Hono edge API", async () => {
    const report = await RelayE2EContractRunner.runContract({
      frameworkName: "hono-api",
      targetPort: honoPort,
      relayPort,
      isHtmlApp: false, // Non-frontend edge REST API
      customFrameworkCheck: async ({ relayBaseUrl }) => {
        const res = await fetch(`${relayBaseUrl}/`);
        const json = (await res.json()) as {
          status: string;
          framework: string;
          isRelayed: boolean;
        };
        const usersRes = await fetch(`${relayBaseUrl}/api/users`);
        const usersJson = (await usersRes.json()) as {
          users: Array<{ id: number; name: string }>;
        };

        const pass =
          res.status === 200 &&
          json.status === "ok" &&
          json.framework === "hono" &&
          json.isRelayed === true &&
          usersJson.users.length === 2;

        return {
          pass,
          detail: `Hono isRelayed: ${json.isRelayed}, users count: ${usersJson.users.length}`,
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
