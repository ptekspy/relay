import { describe, expect, it } from "bun:test";
import { TunnelStreamDemuxer } from "../src/stream-demuxer";

describe("TASK-104: High-Throughput HTTP/2 and HTTP/1.1 Tunnel Stream Demuxer", () => {
  it("encodes and decodes binary frames accurately", () => {
    const payload = new TextEncoder().encode("Hello Relay Tunnel");
    const frame = TunnelStreamDemuxer.encodeFrame(42, payload, true);

    const decoded = TunnelStreamDemuxer.decodeFrame(frame);
    expect(decoded.streamId).toBe(42);
    expect(decoded.isEnd).toBe(true);
    expect(new TextDecoder().decode(decoded.data)).toBe("Hello Relay Tunnel");
  });

  it("handles 100 concurrent interleaved streams without head-of-line blocking or corruption", () => {
    const demuxer = new TunnelStreamDemuxer();
    const streamCount = 100;
    const receivedData = new Map<number, string[]>();
    const finishedStreams = new Set<number>();

    // Register 100 streams
    for (let i = 1; i <= streamCount; i++) {
      const streamId = demuxer.createStreamId();
      receivedData.set(streamId, []);

      demuxer.registerStream(streamId, {
        onChunk: (chunk) => {
          receivedData.get(streamId)?.push(new TextDecoder().decode(chunk));
        },
        onEnd: () => {
          finishedStreams.add(streamId);
        },
        onError: () => {},
      });
    }

    expect(demuxer.getActiveStreamCount()).toBe(streamCount);

    // Send interleaved chunks across all streams
    for (let chunkIdx = 0; chunkIdx < 3; chunkIdx++) {
      for (let sId = 1; sId <= streamCount; sId++) {
        const isLast = chunkIdx === 2;
        const msg = `stream-${sId}-part-${chunkIdx}`;
        const frame = TunnelStreamDemuxer.encodeFrame(
          sId,
          new TextEncoder().encode(msg),
          isLast,
        );
        const decoded = TunnelStreamDemuxer.decodeFrame(frame);
        demuxer.handleIncomingChunk(decoded);
      }
    }

    // All 100 streams should have finished
    expect(finishedStreams.size).toBe(streamCount);
    expect(demuxer.getActiveStreamCount()).toBe(0);

    // Verify data integrity for each stream
    for (let sId = 1; sId <= streamCount; sId++) {
      const chunks = receivedData.get(sId);
      expect(chunks).toBeDefined();
      expect(chunks?.length).toBe(3);
      expect(chunks?.join(":")).toBe(
        `stream-${sId}-part-0:stream-${sId}-part-1:stream-${sId}-part-2`,
      );
    }
  });

  it("propagates error cleanly to target stream without affecting other active streams", () => {
    const demuxer = new TunnelStreamDemuxer();
    let stream1Error: Error | null = null;
    let stream2Finished = false;

    demuxer.registerStream(1, {
      onChunk: () => {},
      onEnd: () => {},
      onError: (err) => {
        stream1Error = err;
      },
    });

    demuxer.registerStream(2, {
      onChunk: () => {},
      onEnd: () => {
        stream2Finished = true;
      },
      onError: () => {},
    });

    demuxer.handleStreamError(1, new Error("Upstream socket closed"));
    expect(stream1Error).not.toBeNull();
    expect((stream1Error as unknown as Error).message).toBe(
      "Upstream socket closed",
    );

    // Stream 2 should still be active and succeed
    expect(demuxer.getActiveStreamCount()).toBe(1);
    demuxer.handleIncomingChunk({
      streamId: 2,
      data: new Uint8Array(),
      isEnd: true,
    });
    expect(stream2Finished).toBe(true);
    expect(demuxer.getActiveStreamCount()).toBe(0);
  });
});
