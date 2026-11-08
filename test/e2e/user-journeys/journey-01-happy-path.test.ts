import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import type { RelayGateway } from "../../../apps/relay/cli/src/gateway.js";
import {
  RELAY_COOKIE_NAME,
  RELAY_TOKEN_QUERY,
} from "../../../apps/relay/cli/src/gateway.js";
import {
  createMockDevServer,
  type MockTargetServer,
  spawnTestGateway,
} from "./harness";

describe("Journey 01: Local Developer Happy Path (CLI Host + Dev Server Pairing via QR Token URL)", () => {
  let targetServer: MockTargetServer;
  let gateway: RelayGateway;
  const sessionToken = "session-test-token-happy-path-42";

  beforeEach(async () => {
    targetServer = await createMockDevServer();
    gateway = await spawnTestGateway(targetServer.port, sessionToken);
  });

  afterEach(async () => {
    await gateway.close();
    await targetServer.close();
  });

  it("completes full pairing handshake via QR token URL and proxies upstream dev server HTML", async () => {
    const gatewayUrl = `http://127.0.0.1:${gateway.port}`;

    // 1. Initial QR Code Scan URL hit: GET /?relay_token=<token>
    const qrUrl = `${gatewayUrl}/?${RELAY_TOKEN_QUERY}=${sessionToken}`;
    const initialResponse = await fetch(qrUrl, { redirect: "manual" });

    // Expect 302 Found redirect
    expect(initialResponse.status).toBe(302);

    // Expect Set-Cookie header establishing HttpOnly session
    const setCookie = initialResponse.headers.get("set-cookie");
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain(`${RELAY_COOKIE_NAME}=${sessionToken}`);
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");

    // Expect Location header sanitizes the token out of the URL
    const location = initialResponse.headers.get("location");
    expect(location).toBe("/");
    expect(location).not.toContain(sessionToken);

    // 2. Follow-up request with authenticated cookie: GET /
    const authenticatedResponse = await fetch(gatewayUrl, {
      headers: {
        cookie: `${RELAY_COOKIE_NAME}=${sessionToken}`,
      },
    });

    expect(authenticatedResponse.status).toBe(200);
    expect(authenticatedResponse.headers.get("content-type")).toContain(
      "text/html",
    );

    const htmlBody = await authenticatedResponse.text();
    expect(htmlBody).toContain("App Running on Dev Server");
    expect(htmlBody).toContain("Target endpoint active");

    // 3. Confirm receiver was registered in the gateway's active connection pool
    const activeReceivers = gateway.receiverPool.getAll();
    expect(activeReceivers.length).toBeGreaterThanOrEqual(1);
    expect(activeReceivers[0].ip).toBeDefined();
  });
});
