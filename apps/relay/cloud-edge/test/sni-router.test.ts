import { describe, expect, it } from "bun:test";
import { SniDynamicRouter } from "../src/sni-router";

describe("TASK-102: Wildcard Subdomain & SNI Dynamic Routing", () => {
  const router = new SniDynamicRouter(["relay.paddy.systems", "relay.zone"]);

  it("extracts session IDs accurately from wildcard subdomains and region prefixes", () => {
    expect(
      router.extractSessionIdFromHost("sess-xyz123.relay.paddy.systems"),
    ).toBe("sess-xyz123");
    expect(
      router.extractSessionIdFromHost(
        "sess-xyz123.eu-west.relay.paddy.systems",
      ),
    ).toBe("sess-xyz123");
    expect(router.extractSessionIdFromHost("demo-test.relay.zone:443")).toBe(
      "demo-test",
    );
    expect(router.extractSessionIdFromHost("relay.paddy.systems")).toBeNull();
    expect(router.extractSessionIdFromHost("unknown-domain.com")).toBeNull();
  });

  it("resolves active registered sessions to their tunnel endpoints", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    router.registerTunnel({
      sessionId: "session-abc",
      hostConnectionId: "conn-123",
      region: "eu-west",
      createdAt: new Date().toISOString(),
      expiresAt: future,
    });

    const result = router.resolveHost("session-abc.relay.paddy.systems");
    expect(result.found).toBe(true);
    if (result.found) {
      expect(result.sessionId).toBe("session-abc");
      expect(result.endpoint.hostConnectionId).toBe("conn-123");
    }
  });

  it("returns typed ERR_SESSION_NOT_FOUND with HTML page for unknown sessions", () => {
    const result = router.resolveHost("nonexistent-sess.relay.paddy.systems");
    expect(result.found).toBe(false);
    if (!result.found) {
      expect(result.errorCode).toBe("ERR_SESSION_NOT_FOUND");
      expect(result.htmlResponse).toContain("ERR_SESSION_NOT_FOUND");
      expect(result.htmlResponse).toContain("nonexistent-sess");
    }
  });

  it("handles expired sessions and drops them from routing map", () => {
    const past = new Date(Date.now() - 10_000).toISOString();
    router.registerTunnel({
      sessionId: "session-expired",
      hostConnectionId: "conn-expired",
      region: "us-east",
      createdAt: past,
      expiresAt: past,
    });

    const result = router.resolveHost("session-expired.relay.paddy.systems");
    expect(result.found).toBe(false);
    if (!result.found) {
      expect(result.errorCode).toBe("ERR_SESSION_EXPIRED");
      expect(result.htmlResponse).toContain("ERR_SESSION_EXPIRED");
    }
  });
});
