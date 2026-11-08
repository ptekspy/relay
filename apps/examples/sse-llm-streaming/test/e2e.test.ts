import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createServer } from "node:http";
import { RelayE2EContractRunner } from "@paddy-systems/relay-testing";
import { buildSseServer } from "../src/server";

describe("SSE LLM Token Streaming & Relay Integration E2E Contract", () => {
  let sseServer: ReturnType<typeof buildSseServer>;
  let ssePort: number;
  let relayServer: ReturnType<typeof createServer>;
  let relayPort: number;

  beforeAll(async () => {
    // 1. Start SSE server
    sseServer = buildSseServer();
    await new Promise<void>((resolve) => {
      sseServer.listen(0, "127.0.0.1", () => {
        const addr = sseServer.address();
        if (typeof addr === "object" && addr) ssePort = addr.port;
        resolve();
      });
    });

    // 2. Start Relay Gateway proxy
    relayServer = createServer(async (req, res) => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const bodyBuffer = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

      const upstream = await fetch(`http://127.0.0.1:${ssePort}${req.url}`, {
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

      // Stream chunks immediately to verify unbuffered SSE delivery
      if (upstream.body) {
        for await (const chunk of upstream.body) {
          res.write(chunk);
        }
      }
      res.end();
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
      new Promise<void>((r) => sseServer.close(() => r())),
      new Promise<void>((r) => relayServer.close(() => r())),
    ]);
  });

  it("passes full Relay E2E Contract across unbuffered SSE LLM token stream", async () => {
    const report = await RelayE2EContractRunner.runContract({
      frameworkName: "sse-llm-streaming",
      targetPort: ssePort,
      relayPort,
      isHtmlApp: false, // Non-frontend streaming service
      customFrameworkCheck: async ({ relayBaseUrl }) => {
        const res = await fetch(`${relayBaseUrl}/api/chat/stream`);
        const text = await res.text();

        const contentType = res.headers.get("content-type") || "";
        const isSse = contentType.includes("text/event-stream");
        const hasTokens =
          text.includes("event: token") && text.includes("Relay");
        const hasDone = text.includes("event: done");

        return {
          pass: res.status === 200 && isSse && hasTokens && hasDone,
          detail: `SSE contentType=${contentType}, tokensReceived=${hasTokens}, doneReceived=${hasDone}`,
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
