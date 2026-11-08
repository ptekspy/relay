import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createServer } from "node:http";
import { GraphQLRelayAdapter } from "@paddy-systems/relay-integrations";
import { RelayE2EContractRunner } from "@paddy-systems/relay-testing";
import { buildYogaServer } from "../src/server";

describe("GraphQL Yoga API & Relay Integration E2E Contract", () => {
  let yogaServer: ReturnType<typeof buildYogaServer>;
  let yogaPort: number;
  let relayServer: ReturnType<typeof createServer>;
  let relayPort: number;

  beforeAll(async () => {
    // 1. Start GraphQL Yoga server
    yogaServer = buildYogaServer();
    await new Promise<void>((resolve) => {
      yogaServer.listen(0, "127.0.0.1", () => {
        const addr = yogaServer.address();
        if (typeof addr === "object" && addr) yogaPort = addr.port;
        resolve();
      });
    });

    // 2. Start Relay Gateway proxy
    const adapter = new GraphQLRelayAdapter({
      relayHost: `127.0.0.1:${yogaPort}`,
      endpoint: "/graphql",
    });

    relayServer = createServer(async (req, res) => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const bodyBuffer = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

      const normalizedHeaders = adapter.normalizeHeaders(req.headers);

      const upstream = await fetch(`http://127.0.0.1:${yogaPort}${req.url}`, {
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
      new Promise<void>((r) => yogaServer.close(() => r())),
      new Promise<void>((r) => relayServer.close(() => r())),
    ]);
  });

  it("passes full Relay E2E Contract across GraphQL Yoga API & queries", async () => {
    const report = await RelayE2EContractRunner.runContract({
      frameworkName: "graphql-yoga",
      targetPort: yogaPort,
      relayPort,
      isHtmlApp: false, // Non-frontend API
      customFrameworkCheck: async ({ relayBaseUrl }) => {
        // Execute GraphQL query through Relay tunnel
        const res = await fetch(`${relayBaseUrl}/graphql`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            query: "{ hello health { status graphql } }",
          }),
        });

        const json = (await res.json()) as {
          data: { hello: string; health: { status: string; graphql: boolean } };
        };

        const pass =
          res.status === 200 &&
          json.data.hello.includes("GraphQL Yoga") &&
          json.data.health.graphql === true;

        return {
          pass,
          detail: `GraphQL hello: ${json.data?.hello}`,
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
