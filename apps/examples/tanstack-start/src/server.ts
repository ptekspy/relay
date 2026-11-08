import { createServer } from "node:http";
import { TanStackStartRelayAdapter } from "@paddy-systems/relay-integrations";

export function buildTanStackServer() {
  const adapter = new TanStackStartRelayAdapter();

  const server = createServer((req, res) => {
    if (req.url === "/" && req.method === "GET") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      const rawHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>TanStack Start Relay Example</title>
</head>
<body>
  <div id="root">
    <h1>TanStack Start Full-Stack App</h1>
    <p>Type-safe routing and server functions</p>
  </div>
</body>
</html>`;
      const htmlWithAgent = adapter.injectAgentScript(rawHtml);
      res.end(htmlWithAgent);
      return;
    }

    if (req.url === "/api/test-echo" && req.method === "POST") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ echoed: true, framework: "tanstack-start" }));
      return;
    }

    if (req.url?.startsWith("/_serverFn") && req.method === "POST") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          serverFn: true,
          result: { message: "Hello from TanStack Start serverFn" },
        }),
      );
      return;
    }

    res.writeHead(404);
    res.end("Not Found");
  });

  return server;
}
