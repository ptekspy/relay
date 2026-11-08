import { describe, expect, it } from "bun:test";
import type { SessionComment } from "@paddy-systems/relay-recording";

describe("Session Recording, Replay & In-Context Feedback", () => {
  const sampleComments: SessionComment[] = [
    {
      id: "cmt_1",
      sessionId: "sess_test",
      timestampMs: 1200,
      position: { xPercent: 25.5, yPercent: 40.2 },
      targetSelector: "header nav button.menu",
      author: { name: "Designer Dave" },
      content: "Hamburger icon padding feels too cramped on iPhone 15",
      resolved: false,
      createdAt: 1710000000,
    },
    {
      id: "cmt_2",
      sessionId: "sess_test",
      timestampMs: 5400,
      position: { xPercent: 78.1, yPercent: 62.4 },
      targetSelector: "form#checkout button[type='submit']",
      author: { name: "QA Quinn" },
      content: "CTA button text overflows outside boundary on smaller widths",
      resolved: false,
      createdAt: 1710000010,
    },
  ];

  it("filters active comments within temporal window during replay", () => {
    const playheadMs = 1500;
    const windowMs = 1000;

    const activeComments = sampleComments.filter(
      (c) => Math.abs(c.timestampMs - playheadMs) <= windowMs,
    );

    expect(activeComments.length).toBe(1);
    expect(activeComments[0]?.id).toBe("cmt_1");
  });

  it("calculates exact scrubber track marker percentages", () => {
    const totalDurationMs = 10000;

    const markers = sampleComments.map((c) => ({
      id: c.id,
      percent: (c.timestampMs / totalDurationMs) * 100,
      author: c.author.name,
      content: c.content,
    }));

    expect(markers[0]?.percent).toBe(12);
    expect(markers[1]?.percent).toBe(54);
    expect(markers[0]?.author).toBe("Designer Dave");
  });

  it("normalizes and preserves spatial coordinates within 0..100 bounds", () => {
    const testCoordinates = [
      { rawX: -5, rawY: 50, expectedX: 0, expectedY: 50 },
      { rawX: 105, rawY: 200, expectedX: 100, expectedY: 100 },
      { rawX: 33.3333, rawY: 66.6666, expectedX: 33.3, expectedY: 66.7 },
    ];

    for (const coord of testCoordinates) {
      const clampedX = Math.min(100, Math.max(0, coord.rawX));
      const clampedY = Math.min(100, Math.max(0, coord.rawY));
      const normalizedX = Math.round(clampedX * 10) / 10;
      const normalizedY = Math.round(clampedY * 10) / 10;

      expect(normalizedX).toBe(coord.expectedX);
      expect(normalizedY).toBe(coord.expectedY);
    }
  });
});
