import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { createServer } from "node:http";
import { createConnection, type Socket } from "node:net";
import type { RelayGateway } from "../../../apps/relay/cli/src/gateway.js";
import { RELAY_COOKIE_NAME } from "../../../apps/relay/cli/src/gateway.js";
import { spawnTestGateway } from "./harness";

describe("Journey 04: Hot Module Replacement (HMR) & Asset Streaming Over Relay Gateway", () => {
  let targetServer: ReturnType<typeof createServer>;
  let targetPort: number;
  let gateway: RelayGateway;
  const sessionToken = "token-hmr-stream-test-99";
  let receivedHeadersOnTarget: Record<string, string | string[] | undefined> =
    {};

  beforeEach(async () => {
    // 1. Create target dev server with WebSocket upgrade listener simulating Next.js / Vite HMR
    targetServer = createServer((req, res) => {
      res.writeHead(200, { "content-type": "text/plain" });
      res.end("dev-server-http");
    });

    targetServer.on("upgrade", (req, socket: Socket) => {
      receivedHeadersOnTarget = { ...req.headers };

      // Accept upgrade with standard 101 Switching Protocols
      socket.write(
        "HTTP/1.1 101 Switching Protocols\r\n" +
          "Upgrade: websocket\r\n" +
          "Connection: Upgrade\r\n" +
          "Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=\r\n\r\n",
      );

      // Echo back any incoming data frame or message
      socket.on("data", (data) => {
        socket.write(data);
      });
    });

    targetPort = await new Promise<number>((resolve) => {
      targetServer.listen(0, "127.0.0.1", () => {
        const addr = targetServer.address();
        resolve((addr as { port: number }).port);
      });
    });

    // 2. Start Relay Gateway
    gateway = await spawnTestGateway(targetPort, sessionToken);
  });

  afterEach(async () => {
    await gateway.close();
    await new Promise<void>((resolve) => targetServer.close(() => resolve()));
  });

  it("transparently bridges WebSocket HMR upgrades and normalizes Origin/Host headers", async () => {
    // 3. Connect raw TCP socket to Relay Gateway and perform WebSocket upgrade
    const clientSocket = createConnection(gateway.port, "127.0.0.1");

    const upgradeResponsePromise = new Promise<string>((resolve) => {
      clientSocket.once("data", (chunk) => {
        resolve(chunk.toString());
      });
    });

    await new Promise<void>((resolve) => clientSocket.once("connect", resolve));

    // Send HTTP upgrade request with session cookie and mobile/foreign Origin
    const upgradeRequest =
      "GET /_next/webpack-hmr HTTP/1.1\r\n" +
      `Host: 192.168.1.100:${gateway.port}\r\n` +
      "Upgrade: websocket\r\n" +
      "Connection: Upgrade\r\n" +
      "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n" +
      "Sec-WebSocket-Version: 13\r\n" +
      "Origin: http://192.168.1.100:7331\r\n" +
      `Cookie: ${RELAY_COOKIE_NAME}=${sessionToken}\r\n\r\n`;

    clientSocket.write(upgradeRequest);

    const upgradeResponse = await upgradeResponsePromise;

    // 4. Verify 101 Switching Protocols received from Gateway
    expect(upgradeResponse).toStartWith("HTTP/1.1 101 Switching Protocols");
    expect(upgradeResponse).toContain("Upgrade: websocket");

    // 5. Verify Gateway normalized the Host and Origin headers forwarded to dev server
    expect(receivedHeadersOnTarget.host).toBe(`localhost:${targetPort}`);
    expect(receivedHeadersOnTarget.origin).toBe(
      `http://localhost:${targetPort}`,
    );

    // 6. Test bidirectional socket data forwarding (HMR heartbeat / hot patch)
    const testPayload = "HMR_PAYLOAD_CHUNK_123";
    const echoPromise = new Promise<string>((resolve) => {
      clientSocket.once("data", (chunk) => {
        resolve(chunk.toString());
      });
    });

    clientSocket.write(testPayload);
    const echoed = await echoPromise;
    expect(echoed).toBe(testPayload);

    clientSocket.destroy();
  });
});
