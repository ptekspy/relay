import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createServer } from "node:http";
import { RelayE2EContractRunner } from "@paddy-systems/relay-testing";
import { io as ClientIO } from "socket.io-client";
import { buildSocketIoServer } from "../src/server";

describe("Socket.io Real-time WebSocket & Relay Integration E2E Contract", () => {
  let socketApp: ReturnType<typeof buildSocketIoServer>;
  let targetPort: number;
  let relayServer: ReturnType<typeof createServer>;
  let relayPort: number;

  beforeAll(async () => {
    // 1. Start Socket.io HTTP server
    socketApp = buildSocketIoServer();
    await new Promise<void>((resolve) => {
      socketApp.httpServer.listen(0, "127.0.0.1", () => {
        const addr = socketApp.httpServer.address();
        if (typeof addr === "object" && addr) targetPort = addr.port;
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

      const upstream = await fetch(`http://127.0.0.1:${targetPort}${req.url}`, {
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
      new Promise<void>((r) => socketApp.io.close(() => r())),
      new Promise<void>((r) => relayServer.close(() => r())),
    ]);
  });

  it("passes full Relay E2E Contract across Socket.io real-time service", async () => {
    const report = await RelayE2EContractRunner.runContract({
      frameworkName: "socket-io",
      targetPort,
      relayPort,
      isHtmlApp: false, // Non-frontend real-time service
      hmrPath: "/socket.io/",
      customFrameworkCheck: async () => {
        // Connect Socket.io client to target
        const client = ClientIO(`http://127.0.0.1:${targetPort}`, {
          path: "/socket.io/",
          transports: ["polling", "websocket"],
        });

        const welcomePromise = new Promise<{ message: string }>((resolve) => {
          client.on("welcome", (data) => resolve(data));
        });

        const welcome = await welcomePromise;
        client.disconnect();

        const pass = welcome.message.includes("Socket.io via Relay");
        return {
          pass,
          detail: `Socket.io message: ${welcome.message}`,
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
