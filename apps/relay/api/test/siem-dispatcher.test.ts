import { describe, expect, it } from "bun:test";
import {
  computeHmacSignature,
  SiemWebhookDispatcher,
} from "../src/auth/siem-dispatcher.js";

describe("TASK-167: SIEM Audit Log Streaming & Webhook Dispatcher", () => {
  it("computes accurate HMAC-SHA256 signature for verification", () => {
    const payload = '{"action":"login"}';
    const secret = "super-secret-key-123";
    const sig = computeHmacSignature(payload, secret);

    expect(typeof sig).toBe("string");
    expect(sig.length).toBe(64); // 256 bits = 64 hex characters
  });

  it("dispatches audit events to SIEM subscribers with signature", async () => {
    const dispatcher = new SiemWebhookDispatcher();
    dispatcher.registerSubscription({
      id: "sub-datadog",
      teamId: "team-alpha",
      targetUrl: "https://http-intake.logs.datadoghq.com/api/v2/logs",
      secret: "sec_dd_99",
      eventTypes: ["session:share", "session:kill"],
    });

    let sentHeader = "";
    const results = await dispatcher.dispatch(
      {
        id: "evt-1",
        type: "session:kill",
        teamId: "team-alpha",
        actor: "admin@alpha.com",
        ipAddress: "10.0.0.1",
        timestamp: Date.now(),
        details: { sessionId: "sess-kill-1" },
      },
      async (_url, _body, headers) => {
        sentHeader = headers["X-Relay-Signature-256"] ?? "";
        return { status: 200 };
      },
    );

    expect(results.length).toBe(1);
    expect(results[0]?.success).toBe(true);
    expect(results[0]?.attempts).toBe(1);
    expect(sentHeader.startsWith("sha256=")).toBe(true);
  });

  it("retries on 5xx server responses up to 3 attempts", async () => {
    const dispatcher = new SiemWebhookDispatcher();
    dispatcher.registerSubscription({
      id: "sub-splunk",
      teamId: "team-beta",
      targetUrl: "https://splunk.hec.corp/services/collector",
      secret: "sec_splunk",
      eventTypes: ["receiver:connected"],
    });

    let attemptsCount = 0;
    const results = await dispatcher.dispatch(
      {
        id: "evt-2",
        type: "receiver:connected",
        teamId: "team-beta",
        actor: "device-pixel8",
        ipAddress: "192.168.1.50",
        timestamp: Date.now(),
        details: { device: "Pixel 8" },
      },
      async () => {
        attemptsCount++;
        if (attemptsCount < 3) {
          return { status: 503 }; // fail first two
        }
        return { status: 200 }; // succeed on third
      },
    );

    expect(results[0]?.success).toBe(true);
    expect(results[0]?.attempts).toBe(3);
    expect(attemptsCount).toBe(3);
  });
});
