import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createServer } from "node:http";
import { RelayE2EContractRunner } from "../src/e2e-contract.js";

describe("Relay E2E Contract Runner", () => {
  let targetServer: ReturnType<typeof createServer>;
  let targetPort: number;

  beforeAll(async () => {
    targetServer = createServer((req, res) => {
      if (req.url === "/api/test-echo" && req.method === "POST") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ received: true }));
        return;
      }

      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(`<!doctype html>
<html>
  <head><title>Test App</title><script src="/agent.js"></script></head>
  <body><h1>Test App</h1></body>
</html>`);
    });

    await new Promise<void>((resolve) => {
      targetServer.listen(0, "127.0.0.1", () => {
        const addr = targetServer.address();
        if (typeof addr === "object" && addr) {
          targetPort = addr.port;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => targetServer.close(() => resolve()));
  });

  it("evaluates and passes all 6 contract dimensions for an HTML application", async () => {
    // For direct loopback contract test, relayPort points to targetPort
    const report = await RelayE2EContractRunner.runContract({
      frameworkName: "test-framework",
      targetPort,
      relayPort: targetPort,
      isHtmlApp: true,
      customFrameworkCheck: async () => ({ pass: true, detail: "custom ok" }),
    });

    expect(report.allPassed).toBe(true);
    expect(report.checks.httpGet).toBe(true);
    expect(report.checks.httpPost).toBe(true);
    expect(report.checks.agentInjection).toBe(true);
    expect(report.checks.webSocketHmr).toBe(true);
    expect(report.checks.frameworkSpecific).toBe(true);
    expect(report.checks.latencyPassed).toBe(true);
  });
});
