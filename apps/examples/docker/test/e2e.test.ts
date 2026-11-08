import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createServer } from "node:http";
import { DockerPortDetector } from "@paddy-systems/relay-integrations";
import { RelayE2EContractRunner } from "@paddy-systems/relay-testing";

describe("Docker Container Service & Relay Integration E2E Contract", () => {
  let dockerService: ReturnType<typeof createServer>;
  let containerPort: number;
  let relayServer: ReturnType<typeof createServer>;
  let relayPort: number;

  beforeAll(async () => {
    // 1. Containerized HTTP service simulation (Backend API)
    dockerService = createServer((req, res) => {
      if (req.url === "/health") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ status: "healthy", container: true }));
        return;
      }

      if (req.url === "/api/test-echo" && req.method === "POST") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ echoed: true, service: "docker" }));
        return;
      }

      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ message: "Docker container backend service" }));
    });

    await new Promise<void>((resolve) => {
      dockerService.listen(0, "127.0.0.1", () => {
        const addr = dockerService.address();
        if (typeof addr === "object" && addr) containerPort = addr.port;
        resolve();
      });
    });

    // 2. Relay Gateway proxying the container
    relayServer = createServer(async (req, res) => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const bodyBuffer = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

      const upstream = await fetch(
        `http://127.0.0.1:${containerPort}${req.url}`,
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
      new Promise<void>((r) => dockerService.close(() => r())),
      new Promise<void>((r) => relayServer.close(() => r())),
    ]);
  });

  it("passes full Relay E2E Contract across Docker containerized API service", async () => {
    // Test Docker Port Detector port resolution
    const mockInspectOutput = {
      [`${containerPort}/tcp`]: [
        { HostIp: "0.0.0.0", HostPort: String(containerPort) },
      ],
    };
    const bindings = DockerPortDetector.parsePortBindings(mockInspectOutput);
    const resolvedPort = DockerPortDetector.resolveHostPort(
      containerPort,
      bindings,
    );
    const reachableIp = DockerPortDetector.resolveReachableHostIp(
      false,
      "192.168.1.50",
    );

    const report = await RelayE2EContractRunner.runContract({
      frameworkName: "docker",
      targetPort: containerPort,
      relayPort,
      isHtmlApp: false, // Non-HTML backend service
      customFrameworkCheck: async ({ relayBaseUrl }) => {
        const res = await fetch(`${relayBaseUrl}/health`);
        const data = (await res.json()) as {
          status: string;
          container: boolean;
        };
        const bindingMatch =
          resolvedPort === containerPort && bindings.length > 0;

        return {
          pass: res.status === 200 && data.status === "healthy" && bindingMatch,
          detail: `reachableIp=${reachableIp}, hostPort=${resolvedPort}`,
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
