import { HonoRelayAdapter } from "@paddy-systems/relay-integrations";
import { Hono } from "hono";

export function buildApp() {
  const adapter = new HonoRelayAdapter();
  const app = new Hono();

  app.use("*", adapter.middleware());

  app.get("/", (c) => {
    return c.json({
      status: "ok",
      framework: "hono",
      isRelayed: c.get("isRelayed" as never),
    });
  });

  app.get("/health", (c) => {
    return c.json({ status: "healthy", runtime: "edge-or-node" });
  });

  app.post("/api/test-echo", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    return c.json({ echoed: true, body });
  });

  app.get("/api/users", (c) => {
    return c.json({
      users: [
        { id: 1, name: "Alice", role: "admin" },
        { id: 2, name: "Bob", role: "developer" },
      ],
    });
  });

  return app;
}
