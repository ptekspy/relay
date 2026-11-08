import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import {
  type RelayGateway,
  startRelayGateway,
} from "../../../apps/relay/cli/src/gateway.js";

export interface MockTargetServer {
  port: number;
  server: Server;
  url: string;
  close: () => Promise<void>;
}

/**
 * Creates an ephemeral target development server simulating Next.js, Vite, or another dev server.
 */
export async function createMockDevServer(
  customHandler?: (req: IncomingMessage, res: ServerResponse) => void,
): Promise<MockTargetServer> {
  const server = createServer((req, res) => {
    if (customHandler) {
      customHandler(req, res);
      return;
    }

    if (req.url === "/api/test-echo") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, echo: req.url, method: req.method }));
      return;
    }

    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Relay Target Dev Server</title>
</head>
<body>
  <div id="root">
    <h1>App Running on Dev Server</h1>
    <p>Target endpoint active</p>
  </div>
</body>
</html>`);
  });

  const port = await new Promise<number>((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (addr && typeof addr === "object") {
        resolve(addr.port);
      } else {
        reject(new Error("Failed to acquire ephemeral port"));
      }
    });
  });

  return {
    port,
    server,
    url: `http://127.0.0.1:${port}`,
    close: async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}

/**
 * Spawns an authenticated Relay Gateway on a dynamically assigned free port.
 */
export async function spawnTestGateway(
  targetPort: number,
  sessionToken = "relay-test-e2e-token-xyz-123",
): Promise<RelayGateway> {
  // Use a high ephemeral port range for test gateway to prevent collisions
  const preferredPort = 7400 + Math.floor(Math.random() * 500);

  return await startRelayGateway({
    preferredPort,
    targetPort,
    sessionToken,
    maxRequestsPerMinute: 30,
  });
}
