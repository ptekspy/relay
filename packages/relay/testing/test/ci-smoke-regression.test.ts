import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createServer, type Server } from "node:http";
import {
  EphemeralTokenManager,
  PerformanceBudgetEngine,
  RelayActionCommentBuilder,
  RelayPlaywrightConnector,
} from "../src/index.js";

describe("TASK-190: CI Automation Smoke & Regression Test Suite", () => {
  let mockServer: Server;
  let devPort: number;

  beforeAll(async () => {
    mockServer = createServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(
        "<html><body><h1>Relay CI Preview</h1><button id='action'>Submit</button></body></html>",
      );
    });

    await new Promise<void>((resolve) => {
      mockServer.listen(0, "127.0.0.1", () => {
        const address = mockServer.address();
        if (address && typeof address === "object") {
          devPort = address.port;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      mockServer.close(() => resolve());
    });
  });

  it("executes complete CI automation workflow end-to-end in < 1 second", async () => {
    const pipelineStartTime = Date.now();

    // 1. Provision Ephemeral Token
    const tokenManager = new EphemeralTokenManager();
    const token = tokenManager.mintToken({
      ciRunnerId: "ci-job-matrix-ubuntu-24",
      repository: "Paddy-Systems/p-s-core",
      prNumber: 99,
      ttlSeconds: 1800,
    });
    expect(token.isRevoked).toBe(false);

    // 2. Register mock active tunnel session
    const sessionId = "ci_sess_smoke_99";
    const tunnelUrl = `https://${sessionId}.relay.paddy.systems`;
    tokenManager.registerResource(token.tokenId, sessionId);

    // 3. Connect Playwright Driver over data channel
    const page = await RelayPlaywrightConnector.connect({
      tunnelUrl,
      mockDevice: {
        id: "ci-device-pixel",
        name: "Google Pixel 8 (Virtual)",
        platform: "android",
        viewport: { width: 412, height: 915 },
      },
    });

    // 4. Drive Playwright interactions against dev server
    const navResult = await page.goto(`http://127.0.0.1:${devPort}`);
    expect(navResult.status).toBe(200);

    const clickResult = await page.click("button#action");
    expect(clickResult).toBe(true);

    const evalResult = await page.evaluate<number>("21 * 2");
    expect(evalResult).toBe(42);

    // 5. Evaluate Performance Budget assertions
    const perfEngine = new PerformanceBudgetEngine();
    const budgetResult = perfEngine.evaluateDevice({
      deviceId: page.device.id,
      deviceName: page.device.name,
      platform: page.device.platform,
      ttfbMs: 65,
      fcpMs: 350,
      lcpMs: 950,
      cls: 0.01,
      inpMs: 18,
    });
    expect(budgetResult.passed).toBe(true);
    expect(budgetResult.violations.length).toBe(0);

    // 6. Generate GitHub PR Preview Comment
    const prComment = RelayActionCommentBuilder.formatPrComment({
      tunnelUrl,
      lanUrl: `http://127.0.0.1:${devPort}`,
      qrCodeDataUrl: "data:image/png;base64,smoke_test_qr",
      branch: "ci/smoke-test",
      commitSha: "c1a2b3d4e5f6",
      sessionId,
    });
    expect(prComment).toContain("### ⚡ Relay Mobile Preview Tunnel Ready");
    expect(prComment).toContain(tunnelUrl);

    // 7. Teardown and Cleanup ephemeral resources
    const cleanedSessions: string[] = [];
    await tokenManager.revokeAndCleanup(token.tokenId, async (cleanedId) => {
      cleanedSessions.push(cleanedId);
    });
    expect(cleanedSessions).toEqual([sessionId]);
    expect(tokenManager.validateToken(token.tokenId).valid).toBe(false);

    // 8. Performance assertion: full pipeline runs in under 1 second (< 1000ms)
    const pipelineDurationMs = Date.now() - pipelineStartTime;
    expect(pipelineDurationMs).toBeLessThan(1000);
  });
});
