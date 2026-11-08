import { createServer } from "node:http";
import { SseStreamAdapter } from "@paddy-systems/relay-integrations";

export function buildSseServer() {
  const adapter = new SseStreamAdapter();

  const server = createServer(async (req, res) => {
    if (req.url === "/" && req.method === "GET") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok", service: "sse-llm-streaming" }));
      return;
    }

    if (req.url === "/api/test-echo" && req.method === "POST") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ echoed: true, service: "sse-llm" }));
      return;
    }

    // AI LLM Streaming endpoint
    if (req.url === "/api/chat/stream") {
      res.writeHead(200, adapter.getSseResponseHeaders());

      const tokens = ["The", " answer", " to", " life", " is", " Relay", "!"];
      for (const token of tokens) {
        res.write(adapter.formatEvent("token", { text: token }));
        await new Promise((r) => setTimeout(r, 10));
      }

      res.write(adapter.formatEvent("done", { finish_reason: "stop" }));
      res.end();
      return;
    }

    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not Found");
  });

  return server;
}
