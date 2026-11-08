import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { type ChildProcess, spawn } from "node:child_process";
import { createServer } from "node:http";
import { join } from "node:path";
import { PythonServerAdapter } from "@paddy-systems/relay-integrations";
import { RelayE2EContractRunner } from "@paddy-systems/relay-testing";

describe("Python Polyglot Service & Relay Integration E2E Contract", () => {
  let pythonProc: ChildProcess;
  let pythonPort: number;
  let relayServer: ReturnType<typeof createServer>;
  let relayPort: number;

  beforeAll(async () => {
    const adapter = new PythonServerAdapter();
    const serverScript = join(__dirname, "..", "server.py");

    // 1. Spawn Python server and extract port from stdout
    await new Promise<void>((resolve, reject) => {
      pythonProc = spawn("python3", [serverScript, "0"]);

      pythonProc.stdout?.on("data", (data: Buffer) => {
        const text = data.toString();
        const detectedPort = adapter.parsePortFromLogs(text);
        if (detectedPort) {
          pythonPort = detectedPort;
          resolve();
        }
      });

      pythonProc.stderr?.on("data", (data: Buffer) => {
        const text = data.toString();
        const detectedPort = adapter.parsePortFromLogs(text);
        if (detectedPort) {
          pythonPort = detectedPort;
          resolve();
        }
      });

      pythonProc.on("error", reject);
    });

    // 2. Start Relay Gateway proxy
    relayServer = createServer(async (req, res) => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const bodyBuffer = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

      const normalizedHeaders = adapter.normalizeHeaders(req.headers);

      const upstream = await fetch(`http://127.0.0.1:${pythonPort}${req.url}`, {
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
    if (pythonProc) {
      pythonProc.kill("SIGTERM");
    }
    if (relayServer) {
      await new Promise<void>((r) => relayServer.close(() => r()));
    }
  });

  it("passes full Relay E2E Contract across Python polyglot service", async () => {
    const report = await RelayE2EContractRunner.runContract({
      frameworkName: "python-fastapi",
      targetPort: pythonPort,
      relayPort,
      isHtmlApp: false, // Non-frontend polyglot service
      customFrameworkCheck: async ({ relayBaseUrl }) => {
        const res = await fetch(`${relayBaseUrl}/health`);
        const json = (await res.json()) as { status: string; runtime: string };

        const pass =
          res.status === 200 &&
          json.status === "healthy" &&
          json.runtime.startsWith("python-");
        return {
          pass,
          detail: `Python runtime: ${json.runtime}`,
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
