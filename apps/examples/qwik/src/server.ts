import { createServer } from "node:http";
import { QwikCityRelayAdapter } from "@paddy-systems/relay-integrations";

export function buildQwikServer() {
  const adapter = new QwikCityRelayAdapter();

  const server = createServer((req, res) => {
    if (req.url === "/" && req.method === "GET") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      const rawHtml = `<!DOCTYPE html>
<html lang="en" q:container="paused" q:version="1.12.0">
<head>
  <meta charset="utf-8">
  <title>Qwik City Relay Example</title>
</head>
<body>
  <div id="qwik-app">
    <h1>Qwik Resumable Application</h1>
    <button on:click="q-counter_onClick[0]">Click Me</button>
  </div>
  <script type="qwik/json">{"ctx":{"#qwik-app":{"r":"0"}}}</script>
</body>
</html>`;
      const htmlWithAgent = adapter.injectAgentScript(rawHtml);
      res.end(htmlWithAgent);
      return;
    }

    if (req.url === "/q-data.json" && req.method === "GET") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          isQwikData: true,
          manifest: { symbols: ["q-counter_onClick"] },
        }),
      );
      return;
    }

    if (req.url === "/api/test-echo" && req.method === "POST") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ echoed: true, framework: "qwik" }));
      return;
    }

    res.writeHead(404);
    res.end("Not Found");
  });

  return server;
}
