import { FastifyRelayAdapter } from "@paddy-systems/relay-integrations";
import Fastify from "fastify";

export function buildServer() {
  const adapter = new FastifyRelayAdapter();
  const fastify = Fastify({
    logger: false,
    trustProxy: adapter.getTrustProxySetting(),
  });

  fastify.get("/", async () => {
    return { status: "ok", framework: "fastify" };
  });

  fastify.get("/health", async () => {
    return { status: "ok", framework: "fastify" };
  });

  fastify.post("/api/test-echo", async (request) => {
    return { echoed: true, body: request.body };
  });

  fastify.get("/api/items", async () => {
    return {
      items: [
        { id: 1, name: "Fastify Item 1" },
        { id: 2, name: "Fastify Item 2" },
      ],
    };
  });

  return fastify;
}

if (import.meta.main) {
  const server = buildServer();
  const port = Number(process.env.PORT || 3001);
  server.listen({ port, host: "0.0.0.0" }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Fastify API listening on ${address}`);
  });
}
