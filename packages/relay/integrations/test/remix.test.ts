import { describe, expect, it } from "bun:test";
import { RemixReactRouterAdapter } from "../src/remix.js";

describe("TASK-125: Remix / React Router v7 Dev Adapter", () => {
  it("detects Remix data loader requests", () => {
    const adapter = new RemixReactRouterAdapter();

    expect(
      adapter.isRemixDataRequest("/dashboard?_data=routes%2Fdashboard", {}),
    ).toBe(true);
    expect(
      adapter.isRemixDataRequest("/api/items", {
        accept: "application/x-remix-response, text/html",
      }),
    ).toBe(true);
    expect(adapter.isRemixDataRequest("/about", { accept: "text/html" })).toBe(
      false,
    );
  });

  it("normalizes CORS headers and exposes Remix redirect headers", () => {
    const adapter = new RemixReactRouterAdapter({
      relayOrigin: "https://session-1.relay.paddy.systems",
    });

    const headers = adapter.normalizeCorsHeaders(
      "https://session-1.relay.paddy.systems",
      {
        "content-type": "application/json",
        "x-remix-redirect": "http://localhost:5173/profile",
      },
    );

    expect(headers["access-control-allow-origin"]).toBe(
      "https://session-1.relay.paddy.systems",
    );
    expect(headers["access-control-allow-credentials"]).toBe("true");
    expect(headers["access-control-expose-headers"]).toContain(
      "X-Remix-Redirect",
    );
    expect(headers["x-remix-redirect"]).toBe(
      "https://session-1.relay.paddy.systems/profile",
    );
  });

  it("provides Express/Connect compatible dev middleware", () => {
    const adapter = new RemixReactRouterAdapter();
    const middleware = adapter.createDevMiddleware();

    const headersSet: Record<string, string> = {};
    const fakeReq = {
      url: "/_data",
      headers: { origin: "http://192.168.1.15:7331" },
    };
    const fakeRes = {
      setHeader: (k: string, v: string) => {
        headersSet[k] = v;
      },
    };
    let nextCalled = false;

    middleware(fakeReq, fakeRes, () => {
      nextCalled = true;
    });

    expect(headersSet["Access-Control-Allow-Origin"]).toBe(
      "http://192.168.1.15:7331",
    );
    expect(nextCalled).toBe(true);
  });
});
