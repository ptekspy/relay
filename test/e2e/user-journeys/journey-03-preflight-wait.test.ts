import { afterEach, describe, expect, it } from "bun:test";
import { createServer } from "node:http";
import type { RelayGateway } from "../../../apps/relay/cli/src/gateway.js";
import { checkPortReachable } from "../../../apps/relay/cli/src/networking.js";
import { runPreflightChecks } from "../../../apps/relay/cli/src/preflight.js";
import { spawnTestGateway } from "./harness";

describe("Journey 03: Target Server Boot Delay / Preflight Wait & Auto-Recovery", () => {
  let targetServer: ReturnType<typeof createServer> | null = null;
  let gateway: RelayGateway | null = null;

  afterEach(async () => {
    if (gateway) await gateway.close();
    if (targetServer) {
      await new Promise<void>((resolve) =>
        targetServer!.close(() => resolve()),
      );
    }
  });

  it("handles offline dev server gracefully, polls until boot, and auto-establishes gateway", async () => {
    // 1. Pick an arbitrary unused port in the 48000+ range
    const targetPort = 48000 + Math.floor(Math.random() * 5000);

    // 2. Preflight assertion: verify target port is currently inactive
    const initiallyActive = await checkPortReachable(
      targetPort,
      "127.0.0.1",
      300,
    );
    expect(initiallyActive).toBe(false);

    const preflight = await runPreflightChecks({
      port: targetPort,
      noBrowser: true,
      largeQr: false,
    });
    expect(preflight.targetPortActive).toBe(false);

    // 3. Simulate delayed startup of the target server after 400ms
    const delayedBootPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        targetServer = createServer((req, res) => {
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify({ delayedBoot: true, path: req.url }));
        });
        targetServer.listen(targetPort, "127.0.0.1", () => {
          resolve();
        });
      }, 400);
    });

    // 4. Polling loop simulating PortWaiting component
    let portReady = false;
    const maxPollAttempts = 15;
    let attempts = 0;

    await delayedBootPromise;

    while (attempts < maxPollAttempts && !portReady) {
      attempts++;
      portReady = await checkPortReachable(targetPort, "127.0.0.1", 300);
      if (!portReady) {
        await new Promise((r) => setTimeout(r, 100));
      }
    }

    expect(portReady).toBe(true);

    // 5. Gateway initializes upon target port readiness
    const sessionToken = "token-auto-recovery-journey-03";
    gateway = await spawnTestGateway(targetPort, sessionToken);

    // 6. Test gateway successfully proxies traffic to the newly booted server
    const res = await fetch(`http://127.0.0.1:${gateway.port}/status`, {
      headers: {
        cookie: `__relay_session=${sessionToken}`,
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.delayedBoot).toBe(true);
    expect(data.path).toBe("/status");
  });
});
