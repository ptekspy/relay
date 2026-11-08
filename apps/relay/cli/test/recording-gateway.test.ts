import { describe, expect, it } from "bun:test";
import { createServer } from "node:http";
import { startRelayGateway } from "../src/gateway.js";

describe("Relay Gateway Recording & In-Context Feedback", () => {
  it("injects recorder script into proxied HTML responses", async () => {
    // 1. Mock local dev target server that returns HTML
    const targetServer = createServer((req, res) => {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(
        "<!doctype html><html><head><title>App</title></head><body><h1>Hello World</h1></body></html>",
      );
    });

    await new Promise<void>((resolve) =>
      targetServer.listen(9877, "127.0.0.1", resolve),
    );

    const gateway = await startRelayGateway({
      targetPort: 9877,
      sessionToken: "rec-token-123",
      preferredPort: 7341,
    });

    try {
      // Authenticated request to HTML page
      const res = await fetch(`http://127.0.0.1:${gateway.port}/`, {
        headers: {
          cookie: "__relay_session=rec-token-123",
        },
      });

      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain('<script src="/__relay/recorder.js"></script>');
      expect(html).toContain("<h1>Hello World</h1>");
    } finally {
      await gateway.close();
      await new Promise<void>((resolve) => targetServer.close(() => resolve()));
    }
  });

  it("serves recorder script and ingests telemetry chunks and comments", async () => {
    const targetServer = createServer((req, res) => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });

    await new Promise<void>((resolve) =>
      targetServer.listen(9878, "127.0.0.1", resolve),
    );

    let receivedCommentAuthor = "";
    const gateway = await startRelayGateway({
      targetPort: 9878,
      sessionToken: "rec-token-456",
      preferredPort: 7342,
      onCommentReceived: (comment) => {
        receivedCommentAuthor = comment.author.name;
      },
    });

    try {
      // 1. Fetch recorder script
      const scriptRes = await fetch(
        `http://127.0.0.1:${gateway.port}/__relay/recorder.js`,
        {
          headers: { cookie: "__relay_session=rec-token-456" },
        },
      );
      expect(scriptRes.status).toBe(200);
      const scriptContent = await scriptRes.text();
      expect(scriptContent).toContain("window.__RELAY_RECORDER_INSTALLED__");

      // 2. Post telemetry events
      const recordRes = await fetch(
        `http://127.0.0.1:${gateway.port}/__relay/record`,
        {
          method: "POST",
          headers: {
            cookie: "__relay_session=rec-token-456",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            sessionId: "rec-token-456",
            events: [
              {
                timestampMs: 120,
                type: "user_interaction",
                payload: {
                  action: "click",
                  x: 10,
                  y: 20,
                  xPercent: 5,
                  yPercent: 10,
                },
              },
            ],
          }),
        },
      );
      expect(recordRes.status).toBe(200);
      expect(gateway.getRecordedEvents().length).toBe(1);

      // 3. Post in-context comment
      const commentRes = await fetch(
        `http://127.0.0.1:${gateway.port}/__relay/comments`,
        {
          method: "POST",
          headers: {
            cookie: "__relay_session=rec-token-456",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            timestampMs: 500,
            position: { xPercent: 45.2, yPercent: 62.1 },
            targetSelector: "button.checkout-btn",
            author: { name: "Patrick Tester" },
            content: "Checkout modal button is non-responsive",
          }),
        },
      );
      expect(commentRes.status).toBe(200);
      expect(receivedCommentAuthor).toBe("Patrick Tester");
      expect(gateway.getComments().length).toBe(1);

      // 4. Fetch comments list
      const getCommentsRes = await fetch(
        `http://127.0.0.1:${gateway.port}/__relay/comments`,
        {
          headers: { cookie: "__relay_session=rec-token-456" },
        },
      );
      expect(getCommentsRes.status).toBe(200);
      const commentsList = await getCommentsRes.json();
      expect(commentsList.length).toBe(1);
      expect(commentsList[0].targetSelector).toBe("button.checkout-btn");

      // 5. Fetch full session recording manifest
      const recordingRes = await fetch(
        `http://127.0.0.1:${gateway.port}/__relay/recording`,
        {
          headers: { cookie: "__relay_session=rec-token-456" },
        },
      );
      expect(recordingRes.status).toBe(200);
      const manifest = await recordingRes.json();
      expect(manifest.sessionId).toBe("rec-token-456");
      expect(manifest.eventCount).toBe(1);
      expect(manifest.comments.length).toBe(1);
    } finally {
      await gateway.close();
      await new Promise<void>((resolve) => targetServer.close(() => resolve()));
    }
  });
});
