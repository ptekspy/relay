import { createServer } from "node:http";
import { SolidStartRelayAdapter } from "@paddy-systems/relay-integrations";

export function buildSolidServer() {
  const adapter = new SolidStartRelayAdapter();

  const server = createServer((req, res) => {
    if (req.url === "/" && req.method === "GET") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      const rawHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>SolidStart Relay Example</title>
</head>
<body>
  <div id="app">
    <h1>SolidStart Reactive Counter</h1>
    <div data-hk="0-0-0-0">Count: 0</div>
  </div>
</body>
</html>`;
      const htmlWithAgent = adapter.injectAgentScript(rawHtml);
      res.end(htmlWithAgent);
      return;
    }

    if (req.url === "/api/test-echo" && req.method === "POST") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ echoed: true, framework: "solidstart" }));
      return;
    }

    if (req.url === "/_server" && req.method === "POST") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ solidRpc: true, result: 42 }));
      return;
    }

    res.writeHead(404);
    res.end("Not Found");
  });

  return server;
}
