import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(resolve(__dirname, "index.html"), "utf8");

const port = Number(process.env.PORT || 4321);

export const server = Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/") {
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (url.pathname === "/api/slow") {
      const delay = Number(url.searchParams.get("delay") || 2000);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return Response.json({
        message: "Slow response resolved",
        delayMs: delay,
        timestamp: Date.now(),
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`[Relay Stress App] Running on http://localhost:${server.port}`);
