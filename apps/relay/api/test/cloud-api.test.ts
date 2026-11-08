import { describe, expect, it } from "bun:test";
import { toSessionId } from "@paddy-systems/relay-protocol";
import { CloudApiRateLimiter } from "../src/middleware/rate-limit.js";
import { WebRtcSignalingHub } from "../src/signaling/webrtc.js";
import { SessionRegistry } from "../src/storage/session-store.js";

describe("Cloud API & Session Registry (Epic 4)", () => {
  it("creates session with valid short code, token, and ttl", () => {
    const registry = new SessionRegistry();
    const session = registry.createSession({
      targetPort: 3000,
      targetHost: "127.0.0.1",
      ttlSeconds: 1800,
      metadata: { framework: "vite" },
    });

    expect(session.id.startsWith("ses_")).toBe(true);
    expect(session.shortCode.length).toBe(6);
    expect(session.sessionToken.length).toBeGreaterThan(16);
    expect(session.status).toBe("active");
    expect(session.targetPort).toBe(3000);
    expect(session.metadata?.framework).toBe("vite");
    expect(session.expiresAt).toBeGreaterThan(Date.now());
  });

  it("retrieves session by id and short code", () => {
    const registry = new SessionRegistry();
    const created = registry.createSession({ targetPort: 8080 });

    const byId = registry.getSession(created.id);
    expect(byId).toBeDefined();
    expect(byId?.id).toBe(created.id);

    const byCode = registry.getSessionByShortCode(created.shortCode);
    expect(byCode).toBeDefined();
    expect(byCode?.id).toBe(created.id);

    // Case-insensitive lookup
    const lowerCode = created.shortCode.toLowerCase();
    expect(registry.getSessionByShortCode(lowerCode)?.id).toBe(created.id);
  });

  it("refreshes heartbeat and extends expiration", () => {
    const registry = new SessionRegistry();
    const created = registry.createSession({
      targetPort: 5173,
      ttlSeconds: 60,
    });
    const originalExpiry = created.expiresAt;

    const refreshed = registry.updateHeartbeat(created.id, 600);
    expect(refreshed).toBe(true);

    const current = registry.getSession(created.id);
    expect(current?.expiresAt).toBeGreaterThan(originalExpiry);
  });

  it("closes session and deregisters short code", () => {
    const registry = new SessionRegistry();
    const created = registry.createSession({ targetPort: 8000 });

    expect(registry.closeSession(created.id)).toBe(true);
    expect(registry.getSession(created.id)?.status).toBe("closed");
    expect(registry.getSessionByShortCode(created.shortCode)).toBeUndefined();
  });

  it("routes WebRTC signaling messages between peer endpoints", () => {
    const hub = new WebRtcSignalingHub();
    const sessionId = toSessionId("ses_test_webrtc");

    // Host sends offer to receiver
    hub.postMessage({
      sessionId,
      from: "host_cli",
      to: "receiver_tab",
      type: "offer",
      payload: JSON.stringify({ sdp: "v=0\r\no=...", type: "offer" }),
    });

    // Receiver polls messages
    const receiverMessages = hub.consumeMessages(sessionId, "receiver_tab");
    expect(receiverMessages.length).toBe(1);
    expect(receiverMessages[0]?.type).toBe("offer");
    expect(receiverMessages[0]?.from).toBe("host_cli");

    // Subsequent poll is empty (queue drained)
    expect(hub.consumeMessages(sessionId, "receiver_tab").length).toBe(0);

    // Receiver sends ICE candidate back to host
    hub.postMessage({
      sessionId,
      from: "receiver_tab",
      to: "host_cli",
      type: "ice_candidate",
      payload: JSON.stringify({
        candidate: "candidate:1 1 UDP ...",
        sdpMid: "0",
      }),
    });

    const hostMessages = hub.consumeMessages(sessionId, "host_cli");
    expect(hostMessages.length).toBe(1);
    expect(hostMessages[0]?.type).toBe("ice_candidate");
  });

  it("rate limits brute-force attempts on public endpoints", () => {
    const limiter = new CloudApiRateLimiter({
      windowMs: 1000,
      maxRequests: 3,
    });

    const attackerIp = "10.0.0.99";
    expect(limiter.isAllowed(attackerIp)).toBe(true);
    expect(limiter.isAllowed(attackerIp)).toBe(true);
    expect(limiter.isAllowed(attackerIp)).toBe(true);
    expect(limiter.isAllowed(attackerIp)).toBe(false);

    expect(limiter.isAllowed("10.0.0.100")).toBe(true);
  });
});
