import { describe, expect, it } from "bun:test";
import { VideoStorageStreamer } from "../src/storage-streamer.js";

describe("TASK-159: Cloud Object Storage Streaming for Video Recordings", () => {
  it("streams video chunks and finalizes recording ready for playback within 10 seconds", async () => {
    const streamer = new VideoStorageStreamer({
      bucket: "relay-video-recordings",
      endpoint: "r2.cloudflarestorage.com",
      accessKeyId: "mock-key",
      secretAccessKey: "mock-secret",
      publicDomain: "media.relay.paddy.dev",
    });

    const sessionId = "sess-stream-123";

    // Stream 5 chunks of 500kB each
    for (let i = 0; i < 5; i++) {
      const chunkData = new Uint8Array(500 * 1024);
      const res = await streamer.uploadChunk(chunkData, {
        sessionId,
        chunkIndex: i,
        mimeType: "video/webm",
        sizeBytes: chunkData.byteLength,
        timestamp: Date.now() + i * 1000,
      });

      expect(res.chunkKey).toBe(`recordings/${sessionId}/chunk_0000${i}.webm`);
      expect(res.etag).toContain(sessionId);
    }

    const summary = await streamer.finalizeRecording(sessionId, "video/webm");

    expect(summary.sessionId).toBe(sessionId);
    expect(summary.totalChunks).toBe(5);
    expect(summary.totalSizeBytes).toBe(5 * 500 * 1024);
    expect(summary.readyInSeconds).toBeLessThan(10); // Ready within 10 seconds
    expect(summary.playbackUrl).toContain(
      "https://media.relay.paddy.dev/recordings/sess-stream-123/session_stream.webm",
    );
    expect(summary.playbackUrl).toContain("signature=");
  });

  it("generates presigned URLs with custom expiry timestamps", () => {
    const streamer = new VideoStorageStreamer({
      bucket: "relay-recordings",
      endpoint: "s3.us-east-1.amazonaws.com",
      accessKeyId: "key",
      secretAccessKey: "secret",
    });

    const url = streamer.generateSignedPlaybackUrl("recordings/test.mp4", 1800);
    expect(url).toContain(
      "https://relay-recordings.s3.us-east-1.amazonaws.com/recordings/test.mp4",
    );
    expect(url).toContain("expires=");
  });
});
