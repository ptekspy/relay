import { describe, expect, it } from "bun:test";
import {
  EventSerializer,
  RecordingChunkBuffer,
  RecordingStorageEngine,
  ReplayPlayer,
  SensitiveDataRedactor,
  SessionExporter,
} from "../src/index.js";

describe("Session Recording Engine & Replay Player (Epic 8)", () => {
  it("redacts sensitive PII, credentials, and tokens from payloads and headers", () => {
    const redactor = new SensitiveDataRedactor();

    // Text redaction
    const rawText =
      "User card 4532-1234-5678-9012 with Bearer eyJhbGciOiJIUz... and pst_live_abc12345678901234567890";
    const redactedText = redactor.redactText(rawText);
    expect(redactedText).toContain("[REDACTED_CARD]");
    expect(redactedText).toContain("Bearer [REDACTED_TOKEN]");
    expect(redactedText).toContain("[REDACTED_PAT]");

    // Header redaction
    const headers = {
      Authorization: "Bearer secret-token",
      Cookie: "session=abc; token=123",
      "Content-Type": "application/json",
    };
    const redactedHeaders = redactor.redactHeaders(headers);
    expect(redactedHeaders.Authorization).toBe("[REDACTED]");
    expect(redactedHeaders.Cookie).toBe("[REDACTED]");
    expect(redactedHeaders["Content-Type"]).toBe("application/json");

    // DOM password input redaction
    const html =
      '<input type="password" name="password" value="SuperSecretP@ssword123" />';
    const redactedHtml = redactor.redactDomHtml(html);
    expect(redactedHtml).not.toContain("SuperSecretP@ssword123");
    expect(redactedHtml).toContain("[REDACTED_PASSWORD]");
  });

  it("serializes recording events deterministically with monotonic offsets", () => {
    const startTime = Date.now() - 5000;
    const serializer = new EventSerializer(startTime);

    const domEv = serializer.serializeDomSnapshot(
      "<div>Hello World</div>",
      "http://localhost:3000",
    );
    expect(domEv.type).toBe("dom_snapshot");
    expect(domEv.timestampMs).toBeGreaterThanOrEqual(5000);
    if (domEv.type === "dom_snapshot") {
      expect(domEv.payload.html).toBe("<div>Hello World</div>");
    }

    const consoleEv = serializer.serializeConsole("error", [
      "Uncaught TypeError at bundle.js:42",
    ]);
    expect(consoleEv.type).toBe("console");
    if (consoleEv.type === "console") {
      expect(consoleEv.payload.level).toBe("error");
    }

    const netEv = serializer.serializeNetwork({
      url: "http://localhost:3000/api/data",
      method: "POST",
      status: 200,
      durationMs: 45,
      requestHeaders: { Authorization: "Bearer xyz" },
    });
    if (netEv.type === "network") {
      expect(netEv.payload.requestHeaders?.Authorization).toBe("[REDACTED]");
    }
  });

  it("compresses and decompresses recording event chunks with integrity check", () => {
    const engine = new RecordingStorageEngine();
    const serializer = new EventSerializer(1000);

    const events = [
      serializer.serializeDomSnapshot(
        "<div>Page 1</div>",
        "http://localhost:3000",
      ),
      serializer.serializeConsole("log", ["State initialized"]),
      serializer.serializeNetwork({
        url: "http://localhost:3000/api/todos",
        method: "GET",
        status: 200,
        durationMs: 15,
      }),
    ];

    const compressedChunk = engine.compressEvents(events, 0);
    expect(compressedChunk.byteLength).toBeGreaterThan(12);

    const decompressed = engine.decompressEvents(compressedChunk);
    expect(decompressed.length).toBe(3);
    expect(decompressed[0]?.type).toBe("dom_snapshot");
    expect(decompressed[1]?.type).toBe("console");
    expect(decompressed[2]?.type).toBe("network");

    // Corrupted header throws
    const corrupted = new Uint8Array(compressedChunk);
    corrupted[0] = 0x00;
    expect(() => engine.decompressEvents(corrupted)).toThrow();
  });

  it("buffers recording chunks until batch threshold is reached", () => {
    const buffer = new RecordingChunkBuffer(3);
    const serializer = new EventSerializer(1000);

    const ev1 = serializer.serializeConsole("log", ["1"]);
    const ev2 = serializer.serializeConsole("log", ["2"]);
    const ev3 = serializer.serializeConsole("log", ["3"]);

    expect(buffer.append(ev1)).toBeNull();
    expect(buffer.append(ev2)).toBeNull();

    const chunk = buffer.append(ev3);
    expect(chunk).not.toBeNull();
    expect(buffer.completedChunks.length).toBe(1);
  });

  it("replays recorded session deterministically with timestamp seeking", () => {
    const events = [
      {
        timestampMs: 100,
        type: "dom_snapshot" as const,
        payload: { html: "<h1>Title</h1>", url: "http://localhost" },
      },
      {
        timestampMs: 500,
        type: "console" as const,
        payload: { level: "info" as const, args: ["App mounted"] },
      },
      {
        timestampMs: 800,
        type: "bookmark_marker" as const,
        payload: { label: "Button Clicked", category: "user_note" as const },
      },
      {
        timestampMs: 1200,
        type: "network" as const,
        payload: {
          url: "/api/submit",
          method: "POST",
          status: 500,
          durationMs: 40,
        },
      },
      {
        timestampMs: 1500,
        type: "console" as const,
        payload: { level: "error" as const, args: ["Server error 500"] },
      },
    ];

    const player = new ReplayPlayer(events);
    expect(player.getSnapshot().durationMs).toBe(1500);

    // Seek to 600ms: only events <= 600ms are present
    player.seekTo(600);
    const snap1 = player.getSnapshot();
    expect(snap1.currentTimeMs).toBe(600);
    expect(snap1.currentDomHtml).toBe("<h1>Title</h1>");
    expect(snap1.activeConsoleLogs.length).toBe(1);
    expect(snap1.activeNetworkRequests.length).toBe(0);

    // Seek to 1300ms: network request is now included, but 1500ms error is not yet
    player.seekTo(1300);
    const snap2 = player.getSnapshot();
    expect(snap2.activeNetworkRequests.length).toBe(1);
    expect(snap2.activeConsoleLogs.length).toBe(1);
    expect(snap2.markers.length).toBe(1);

    // Seek to end
    player.seekTo(1500);
    const snap3 = player.getSnapshot();
    expect(snap3.activeConsoleLogs.length).toBe(2);
    expect(snap3.playbackState).toBe("ended");
  });

  it("exports session bug reports to GitHub markdown and HAR 1.2 format", () => {
    const exporter = new SessionExporter();
    const events = [
      {
        timestampMs: 200,
        type: "network" as const,
        payload: {
          url: "http://localhost/api/fail",
          method: "GET",
          status: 500,
          durationMs: 30,
        },
      },
      {
        timestampMs: 300,
        type: "console" as const,
        payload: { level: "error" as const, args: ["Fetch failed with 500"] },
      },
    ];

    // GitHub Issue Markdown
    const md = exporter.generateGitHubIssueMarkdown("ses_test123", 350, events);
    expect(md).toContain("Relay Session Bug Report (ses_test123)");
    expect(md).toContain("Fetch failed with 500");
    expect(md).toContain("HTTP 500");
    expect(md).toContain("https://relay.cloud/replay/ses_test123?t=350");

    // HAR 1.2 JSON
    const harStr = exporter.exportHarJson("ses_test123", events);
    const har = JSON.parse(harStr);
    expect(har.log.version).toBe("1.2");
    expect(har.log.entries.length).toBe(1);
    expect(har.log.entries[0].request.method).toBe("GET");
    expect(har.log.entries[0].response.status).toBe(500);
  });

  it("serializes user interactions and spatial in-context session comments", () => {
    const serializer = new EventSerializer(0);

    const clickEvent = serializer.serializeUserInteraction({
      action: "click",
      x: 120,
      y: 350,
      xPercent: 32.5,
      yPercent: 41.2,
      targetSelector: "button#checkout",
    });

    expect(clickEvent.type).toBe("user_interaction");
    if (clickEvent.type === "user_interaction") {
      expect(clickEvent.payload.action).toBe("click");
      expect(clickEvent.payload.xPercent).toBe(32.5);
      expect(clickEvent.payload.targetSelector).toBe("button#checkout");
    }

    const commentEvent = serializer.serializeComment({
      id: "cmt_123",
      sessionId: "ses_abc",
      timestampMs: 4500,
      position: { xPercent: 50, yPercent: 60 },
      targetSelector: "div.hero",
      routeUrl: "/products",
      author: { name: "QA Engineer" },
      content: "Secret token: Bearer my-secret-token-12345 in comment",
      createdAt: 1700000000000,
    });

    expect(commentEvent.type).toBe("session_comment");
    if (commentEvent.type === "session_comment") {
      expect(commentEvent.timestampMs).toBe(4500);
      expect(commentEvent.payload.position.xPercent).toBe(50);
      // Redaction should apply to comment text
      expect(commentEvent.payload.content).toContain("[REDACTED_TOKEN]");
      expect(commentEvent.payload.content).not.toContain(
        "my-secret-token-12345",
      );
    }
  });

  it("generates client-side recorder injection script with feedback overlay", () => {
    const { generateClientRecorderScript } = require("../src/index.js");
    const script = generateClientRecorderScript({
      sessionId: "ses_xyz",
      enableFeedbackOverlay: true,
    });

    expect(script).toContain("window.__RELAY_RECORDER_INSTALLED__");
    expect(script).toContain('"ses_xyz"');
    expect(script).toContain("MutationObserver");
    expect(script).toContain("__relay_feedback_btn");
    expect(script).toContain("/__relay/record");
    expect(script).toContain("/__relay/comments");
  });
});
