import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { createConnection } from "node:net";
import type { RelayGateway } from "../../../apps/relay/cli/src/gateway.js";
import {
  RELAY_COOKIE_NAME,
  RELAY_TOKEN_QUERY,
} from "../../../apps/relay/cli/src/gateway.js";
import { verifyTimingSafeToken } from "../../../packages/relay/protocol/src/crypto.js";
import {
  createMockDevServer,
  type MockTargetServer,
  spawnTestGateway,
} from "./harness";

describe("Journey 07: Gateway Security Boundaries (401 Unauthorized & Timing-Safe Token Rejection)", () => {
  let targetServer: MockTargetServer;
  let gateway: RelayGateway;
  const validToken = "valid-cryptographic-token-32bytes-len";

  beforeEach(async () => {
    targetServer = await createMockDevServer();
    gateway = await spawnTestGateway(targetServer.port, validToken);
  });

  afterEach(async () => {
    await gateway.close();
    await targetServer.close();
  });

  it("verifies timing-safe cryptographic comparisons directly", () => {
    expect(verifyTimingSafeToken(validToken, validToken)).toBe(true);
    expect(verifyTimingSafeToken("wrong-token", validToken)).toBe(false);
    expect(
      verifyTimingSafeToken(validToken.slice(0, -1) + "X", validToken),
    ).toBe(false);
    expect(verifyTimingSafeToken("", validToken)).toBe(false);
    expect(verifyTimingSafeToken(validToken, "")).toBe(false);
  });

  it("rejects unauthenticated and forged HTTP requests with 401 Unauthorized", async () => {
    const gatewayUrl = `http://127.0.0.1:${gateway.port}`;

    // 1. Unauthenticated request without token or cookie
    const resUnauth = await fetch(gatewayUrl);
    expect(resUnauth.status).toBe(401);
    const unauthHtml = await resUnauth.text();
    expect(unauthHtml).toContain("Pairing Required");

    // 2. Request with forged/tampered query token
    const resForgedQuery = await fetch(
      `${gatewayUrl}/?${RELAY_TOKEN_QUERY}=evil-forged-token-99`,
    );
    expect(resForgedQuery.status).toBe(401);

    // 3. Request with forged cookie token
    const resForgedCookie = await fetch(gatewayUrl, {
      headers: {
        cookie: `${RELAY_COOKIE_NAME}=evil-cookie-token-88`,
      },
    });
    expect(resForgedCookie.status).toBe(401);
  });

  it("destroys unauthorized WebSocket upgrade requests with 401 status", async () => {
    const clientSocket = createConnection(gateway.port, "127.0.0.1");

    await new Promise<void>((resolve) => clientSocket.once("connect", resolve));

    const upgradeResponsePromise = new Promise<string>((resolve) => {
      clientSocket.once("data", (chunk) => {
        resolve(chunk.toString());
      });
    });

    // Send WebSocket upgrade without valid session cookie
    const unauthUpgrade =
      "GET /ws HTTP/1.1\r\n" +
      `Host: 127.0.0.1:${gateway.port}\r\n` +
      "Upgrade: websocket\r\n" +
      "Connection: Upgrade\r\n" +
      "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n" +
      "Sec-WebSocket-Version: 13\r\n\r\n";

    clientSocket.write(unauthUpgrade);

    const res = await upgradeResponsePromise;
    expect(res).toStartWith("HTTP/1.1 401 Unauthorized");

    // Socket should be closed by gateway
    await new Promise<void>((resolve) => {
      if (clientSocket.destroyed) {
        resolve();
      } else {
        clientSocket.once("close", () => resolve());
      }
    });
    expect(clientSocket.destroyed).toBe(true);
  });
});
