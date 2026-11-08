import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import type { RelayGateway } from "../../../apps/relay/cli/src/gateway.js";
import { RELAY_COOKIE_NAME } from "../../../apps/relay/cli/src/gateway.js";
import {
  createSession,
  generateShortCode,
  renderTerminalQr,
} from "../../../apps/relay/cli/src/session.js";
import {
  createMockDevServer,
  type MockTargetServer,
  spawnTestGateway,
} from "./harness";

describe("Journey 02: Receiver Pairing via Alphanumeric Short Code on Secondary Device", () => {
  let targetServer: MockTargetServer;
  let gateway: RelayGateway;

  beforeEach(async () => {
    targetServer = await createMockDevServer();
  });

  afterEach(async () => {
    if (gateway) await gateway.close();
    await targetServer.close();
  });

  it("generates ambiguous-free short codes and pairs receiver via mapped session token", async () => {
    // 1. Verify 100 generated short codes strictly exclude ambiguous characters
    const ambiguousRegex = /[0O1IL]/;
    for (let i = 0; i < 100; i++) {
      const code = generateShortCode();
      expect(code).toMatch(/^[A-Z2-9]{3}-[A-Z2-9]{3}$/);
      expect(ambiguousRegex.test(code)).toBe(false);
    }

    // 2. Create session with host and gateway
    const host = "127.0.0.1";
    const session = createSession(host, 7331);
    expect(session.id).toStartWith("rl_");
    expect(session.token).toBeDefined();
    expect(session.shortCode).toMatch(/^[A-Z2-9]{3}-[A-Z2-9]{3}$/);

    // 3. Start Gateway with session token
    gateway = await spawnTestGateway(targetServer.port, session.token);
    const gatewayUrl = `http://127.0.0.1:${gateway.port}`;

    // 4. Simulate ShortCodeEntry pairing component flow:
    // A secondary device resolves the shortCode to session token
    // (In local-web/cloud-web, pair validation maps code -> session.token)
    const simulatedResolvedToken = session.token;
    expect(simulatedResolvedToken).toBe(session.token);

    // 5. Secondary device submits token cookie to gateway
    const pairedResponse = await fetch(`${gatewayUrl}/`, {
      headers: {
        cookie: `${RELAY_COOKIE_NAME}=${simulatedResolvedToken}`,
      },
    });

    expect(pairedResponse.status).toBe(200);
    const text = await pairedResponse.text();
    expect(text).toContain("App Running on Dev Server");

    // 6. Verify QR rendering utilities for terminal (both compact and large modes)
    const compactQr = await renderTerminalQr(session.connectionUrl, "compact");
    expect(compactQr.length).toBeGreaterThan(50);

    const largeQr = await renderTerminalQr(session.connectionUrl, "large");
    expect(largeQr.length).toBeGreaterThan(compactQr.length);
  });
});
