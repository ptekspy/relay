import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createServer } from "node:http";
import type { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestJsRelayAdapter } from "@paddy-systems/relay-integrations";
import { RelayE2EContractRunner } from "@paddy-systems/relay-testing";
import { AppModule } from "../src/app.module";

describe("NestJS Enterprise API & Relay Integration E2E Contract", () => {
  let nestApp: INestApplication;
  let nestPort: number;
  let relayServer: ReturnType<typeof createServer>;
  let relayPort: number;

  beforeAll(async () => {
    // 1. Start NestJS application
    nestApp = await NestFactory.create(AppModule, { logger: false });
    await nestApp.listen(0, "127.0.0.1");
    const server = nestApp.getHttpServer();
    const addr = server.address();
    nestPort = typeof addr === "object" && addr ? addr.port : 0;

    // 2. Start Relay Gateway proxy
    const adapter = new NestJsRelayAdapter({
      relayHost: `127.0.0.1:${nestPort}`,
    });

    relayServer = createServer(async (req, res) => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const bodyBuffer = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

      const normalizedHeaders = adapter.normalizeHeaders(req.headers);

      const upstream = await fetch(`http://127.0.0.1:${nestPort}${req.url}`, {
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
      nestApp.close(),
      new Promise<void>((r) => relayServer.close(() => r())),
    ]);
  });

  it("passes full Relay E2E Contract across NestJS modular API", async () => {
    const adapter = new NestJsRelayAdapter({
      relayHost: `127.0.0.1:${relayPort}`,
    });

    const mockSwagger = adapter.rewriteSwaggerSpec({
      openapi: "3.0.0",
      info: { title: "NestJS Relay App", version: "1.0.0" },
    });

    const report = await RelayE2EContractRunner.runContract({
      frameworkName: "nestjs-api",
      targetPort: nestPort,
      relayPort,
      isHtmlApp: false, // Non-frontend enterprise API
      customFrameworkCheck: async ({ relayBaseUrl }) => {
        const res = await fetch(`${relayBaseUrl}/health`);
        const json = (await res.json()) as { status: string; service: string };
        const modulesRes = await fetch(`${relayBaseUrl}/api/modules`);
        const modulesJson = (await modulesRes.json()) as { modules: string[] };

        const servers = mockSwagger.servers as Array<{ url: string }>;
        const swaggerRewritten =
          servers[0]?.url === `http://127.0.0.1:${relayPort}`;

        const pass =
          res.status === 200 &&
          json.status === "healthy" &&
          modulesJson.modules.includes("TelemetryModule") &&
          swaggerRewritten;

        return {
          pass,
          detail: `Nest health: ${json.status}, modules: ${modulesJson.modules.length}, swaggerUrl: ${servers[0]?.url}`,
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
