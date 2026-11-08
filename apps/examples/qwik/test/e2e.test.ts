import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createServer } from "node:http";
import { QwikCityRelayAdapter } from "@paddy-systems/relay-integrations";
import { RelayE2EContractRunner } from "@paddy-systems/relay-testing";
import { buildQwikServer } from "../src/server";

describe("Qwik City & Relay Integration E2E Contract", () => {
  let targetServer: ReturnType<typeof buildQwikServer>;
  let targetPort: number;
  let relayServer: ReturnType<typeof createServer>;
  let relayPort: number;

  beforeAll(async () => {
    // 1. Start Qwik server
    targetServer = buildQwikServer();
    await new Promise<void>((resolve) => {
      targetServer.listen(0, "127.0.0.1", () => {
        const addr = targetServer.address();
        if (typeof addr === "object" && addr) targetPort = addr.port;
        resolve();
      });
    });

    // 2. Start Relay Gateway proxy
    const adapter = new QwikCityRelayAdapter({
      relayHost: `127.0.0.1:${targetPort}`,
    });

    relayServer = createServer(async (req, res) => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const bodyBuffer = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

      const normalizedHeaders = adapter.normalizeHeaders(req.headers);

      const upstream = await fetch(`http://127.0.0.1:${targetPort}${req.url}`, {
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
      new Promise<void>((r) => targetServer.close(() => r())),
      new Promise<void>((r) => relayServer.close(() => r())),
    ]);
  });

  it("passes full Relay E2E Contract across Qwik City resumable application", async () => {
    const report = await RelayE2EContractRunner.runContract({
      frameworkName: "qwik",
      targetPort,
      relayPort,
      isHtmlApp: true,
      customFrameworkCheck: async ({ relayBaseUrl }) => {
        // Test Qwik resumability data resolution
        const res = await fetch(`${relayBaseUrl}/q-data.json`);
        const json = (await res.json()) as {
          isQwikData: boolean;
          manifest: { symbols: string[] };
        };

        const pass =
          res.status === 200 &&
          json.isQwikData === true &&
          json.manifest.symbols.includes("q-counter_onClick");

        return {
          pass,
          detail: `Qwik symbols: ${json.manifest?.symbols.join(", ")}`,
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
