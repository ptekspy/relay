import { describe, expect, it } from "bun:test";
import { SessionCommentsManager } from "../src/comments.js";
import { ReplayEngine } from "../src/index.js";

describe("SessionCommentsManager & Spatial/Temporal Feedback", () => {
  it("ingests and sorts comments by timestampMs", () => {
    const mgr = new SessionCommentsManager();

    mgr.ingest([
      {
        id: "c2",
        sessionId: "s1",
        timestampMs: 4000,
        position: { xPercent: 20, yPercent: 30 },
        author: { name: "Tester B" },
        content: "Second comment",
        createdAt: 1000,
      },
      {
        id: "c1",
        sessionId: "s1",
        timestampMs: 1500,
        position: { xPercent: 50, yPercent: 50 },
        author: { name: "Tester A" },
        content: "First comment",
        createdAt: 900,
      },
    ]);

    const all = mgr.getComments();
    expect(all.length).toBe(2);
    expect(all[0]?.id).toBe("c1");
    expect(all[1]?.id).toBe("c2");
  });

  it("adds in-context feedback comment with auto-generated id and active window check", () => {
    const mgr = new SessionCommentsManager();

    const created = mgr.addComment({
      sessionId: "s1",
      timestampMs: 2500,
      position: { xPercent: 75.4, yPercent: 12.8 },
      targetSelector: "button.submit-btn",
      author: { name: "Alice" },
      content: "Submit button is misaligned",
    });

    expect(created.id.startsWith("cmt_")).toBe(true);
    expect(created.resolved).toBe(false);

    // Active at 2500ms
    const activeAt2500 = mgr.getActiveCommentsAt(2500);
    expect(activeAt2500.length).toBe(1);
    expect(activeAt2500[0]?.content).toBe("Submit button is misaligned");

    // Active at 4000ms (within default 3000ms window)
    const activeAt4000 = mgr.getActiveCommentsAt(4000);
    expect(activeAt4000.length).toBe(1);

    // Inactive at 6000ms (outside window)
    const activeAt6000 = mgr.getActiveCommentsAt(6000);
    expect(activeAt6000.length).toBe(0);
  });

  it("generates lightweight timeline markers for scrubber display", () => {
    const mgr = new SessionCommentsManager([
      {
        id: "c1",
        sessionId: "s1",
        timestampMs: 3200,
        position: { xPercent: 40, yPercent: 20 },
        author: { name: "Alice" },
        content:
          "A very long comment that exceeds the forty character preview threshold for scrubber badges",
        createdAt: 1000,
      },
    ]);

    const markers = mgr.getTimelineMarkers();
    expect(markers.length).toBe(1);
    expect(markers[0]?.timestampMs).toBe(3200);
    expect(markers[0]?.authorName).toBe("Alice");
    expect(markers[0]?.preview.endsWith("...")).toBe(true);
  });

  it("integrates comments into ReplayEngine snapshot", () => {
    const engine = new ReplayEngine(
      [],
      [
        {
          id: "cmt_initial",
          sessionId: "s1",
          timestampMs: 0,
          position: { xPercent: 10, yPercent: 10 },
          author: { name: "Tester" },
          content: "Initial screen issue",
          createdAt: 1000,
        },
      ],
    );

    const snapshot = engine.getSnapshot();
    expect(snapshot.activeComments?.length).toBe(1);
    expect(snapshot.commentMarkers?.length).toBe(1);
    expect(snapshot.commentMarkers?.[0]?.preview).toBe("Initial screen issue");
  });

  it("adds threaded replies from host or reviewer", () => {
    const mgr = new SessionCommentsManager([
      {
        id: "cmt_thread",
        sessionId: "s1",
        timestampMs: 1000,
        position: { xPercent: 30, yPercent: 40 },
        author: { name: "Tester" },
        content: "Is this color intentional?",
        createdAt: 1000,
      },
    ]);

    const replied = mgr.addReply("cmt_thread", {
      author: { name: "Host Developer", isHost: true },
      content: "No, should be emerald-500. Fixing!",
    });

    expect(replied).toBe(true);
    const comment = mgr.getCommentById("cmt_thread");
    expect(comment?.replies?.length).toBe(1);
    expect(comment?.replies?.[0]?.author.isHost).toBe(true);
    expect(comment?.replies?.[0]?.content).toBe(
      "No, should be emerald-500. Fixing!",
    );
  });

  it("hides archived comments once replay playhead reaches the archive timestamp", () => {
    const mgr = new SessionCommentsManager([
      {
        id: "cmt_archive_test",
        sessionId: "s1",
        timestampMs: 2000,
        position: { xPercent: 50, yPercent: 50 },
        author: { name: "Tester" },
        content: "Temporary banner issue",
        createdAt: 1000,
      },
    ]);

    // Archive comment at 3500ms on the timeline
    mgr.archiveComment("cmt_archive_test", 3500);

    // At 2500ms (between creation and archive point): comment is visible
    const activeBeforeArchive = mgr.getActiveCommentsAt(2500, 3000);
    expect(activeBeforeArchive.length).toBe(1);
    expect(activeBeforeArchive[0]?.id).toBe("cmt_archive_test");

    // At 3500ms (at archive point): comment is hidden
    const activeAtArchive = mgr.getActiveCommentsAt(3500, 3000);
    expect(activeAtArchive.length).toBe(0);

    // At 4000ms (after archive point): comment remains hidden
    const activeAfterArchive = mgr.getActiveCommentsAt(4000, 3000);
    expect(activeAfterArchive.length).toBe(0);
  });
});
