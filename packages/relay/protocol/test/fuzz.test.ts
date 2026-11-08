import { describe, expect, it } from "bun:test";
import { decodeFrame, encodeFrame, FrameType } from "../src/frame.js";
import { StreamDemultiplexer } from "../src/multiplexer.js";

describe("Protocol Fuzzing & Corruption Resistance", () => {
  it("rejects corrupted magic bytes safely", () => {
    const frame = {
      version: 1,
      type: FrameType.CONTROL,
      channelId: 0,
      sequence: 0,
      payload: new Uint8Array([1, 2, 3]),
    };
    const valid = encodeFrame(frame);

    // Corrupt magic byte
    const corrupt = new Uint8Array(valid);
    corrupt[0] = 0x00;

    expect(() => decodeFrame(corrupt)).toThrow(/Invalid magic byte/);
  });

  it("rejects out-of-bounds declared payload lengths", () => {
    const valid = encodeFrame({
      version: 1,
      type: FrameType.CONTROL,
      channelId: 0,
      sequence: 0,
      payload: new Uint8Array([1, 2, 3]),
    });

    // Artificially inflate payload length in header (bytes 8..11) to 32MB
    const view = new DataView(valid.buffer, valid.byteOffset, valid.byteLength);
    view.setUint32(8, 32 * 1024 * 1024, false);

    expect(() => decodeFrame(valid)).toThrow(/exceeds maximum limit/);
  });

  it("demultiplexer survives stream corruption by throwing typed error", () => {
    const demux = new StreamDemultiplexer();
    const garbage = new Uint8Array([0x99, 0x88, 0x77, 0x66]); // Non-R magic byte

    expect(() => demux.feed(garbage)).toThrow(/Stream synchronization lost/);
  });
});
