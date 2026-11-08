import { describe, expect, it } from "bun:test";
import {
  type ClipFrame,
  generateReplayClip,
  THREE_MB_LIMIT,
} from "../src/snippet-generator.js";

describe("TASK-174: One-Click Replay Snippet Generator (15s MP4 / Animated WebP / GIF)", () => {
  const dummyFrames: ClipFrame[] = [];
  const startTime = 100000;

  // Create 30 seconds of frames at 1 fps
  for (let i = 0; i < 30; i++) {
    const frameData = new Uint8Array(1024); // 1KB per frame
    frameData.fill(i % 256);
    dummyFrames.push({
      timestampMs: startTime + i * 1000,
      frameData,
    });
  }

  it("extracts 15-second window centered around specified bug timestamp", () => {
    const centerTimestamp = startTime + 15000; // at 15s mark
    const clip = generateReplayClip(dummyFrames, {
      centerTimestampMs: centerTimestamp,
      durationSeconds: 15,
      format: "webp",
    });

    expect(clip.format).toBe("webp");
    expect(clip.durationMs).toBeGreaterThanOrEqual(14000);
    expect(clip.durationMs).toBeLessThanOrEqual(16000);
    expect(clip.isUnderSizeBudget).toBe(true);
    expect(clip.sizeBytes).toBeLessThan(THREE_MB_LIMIT);

    // Verify RIFF WebP header magic
    expect(clip.data[0]).toBe(0x52); // R
    expect(clip.data[1]).toBe(0x49); // I
    expect(clip.data[2]).toBe(0x46); // F
    expect(clip.data[3]).toBe(0x46); // F
    expect(clip.data[8]).toBe(0x57); // W
    expect(clip.data[9]).toBe(0x45); // E
    expect(clip.data[10]).toBe(0x42); // B
    expect(clip.data[11]).toBe(0x50); // P
  });

  it("generates MP4 formatted snippet with ftyp header", () => {
    const clip = generateReplayClip(dummyFrames, {
      centerTimestampMs: startTime + 10000,
      format: "mp4",
    });

    expect(clip.format).toBe("mp4");
    expect(clip.data[4]).toBe(0x66); // f
    expect(clip.data[5]).toBe(0x74); // t
    expect(clip.data[6]).toBe(0x79); // y
    expect(clip.data[7]).toBe(0x70); // p
    expect(clip.isUnderSizeBudget).toBe(true);
  });

  it("strictly enforces < 3MB size limit under large frame loads", () => {
    const largeFrames: ClipFrame[] = [];
    for (let i = 0; i < 10; i++) {
      const hugeFrame = new Uint8Array(500 * 1024); // 500KB per frame (10 frames = 5MB)
      largeFrames.push({
        timestampMs: startTime + i * 1000,
        frameData: hugeFrame,
      });
    }

    const clip = generateReplayClip(largeFrames, {
      centerTimestampMs: startTime + 5000,
      format: "webp",
      maxSizeBytes: THREE_MB_LIMIT,
    });

    expect(clip.sizeBytes).toBeLessThan(THREE_MB_LIMIT);
    expect(clip.isUnderSizeBudget).toBe(true);
    expect(clip.frameCount).toBeLessThanOrEqual(6); // At most 5 or 6 frames fit before hitting 3MB
  });
});
