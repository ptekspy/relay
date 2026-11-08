import { describe, expect, it } from "bun:test";
import {
  decodeFrame,
  encodeFrame,
  FRAME_MAGIC_BYTE,
  FrameType,
  HEADER_SIZE_BYTES,
  PROTOCOL_VERSION,
} from "../src/frame.js";

describe("Binary Frame Specification", () => {
  it("encodes and decodes a frame with 100% payload fidelity", () => {
    const payload = new TextEncoder().encode("Hello Relay Protocol");
    const frame = {
      version: PROTOCOL_VERSION,
      type: FrameType.EVENT,
      channelId: 2,
      sequence: 42,
      payload,
    };

    const encoded = encodeFrame(frame);
    expect(encoded.byteLength).toBe(HEADER_SIZE_BYTES + payload.byteLength);
    expect(encoded[0]).toBe(FRAME_MAGIC_BYTE);
    expect(encoded[1]).toBe(PROTOCOL_VERSION);
    expect(encoded[2]).toBe(FrameType.EVENT);
    expect(encoded[3]).toBe(2);

    const decoded = decodeFrame(encoded);
    expect(decoded.version).toBe(PROTOCOL_VERSION);
    expect(decoded.type).toBe(FrameType.EVENT);
    expect(decoded.channelId).toBe(2);
    expect(decoded.sequence).toBe(42);
    expect(new TextDecoder().decode(decoded.payload)).toBe(
      "Hello Relay Protocol",
    );
  });

  it("handles zero-length payloads (e.g. heartbeat frames)", () => {
    const frame = {
      version: PROTOCOL_VERSION,
      type: FrameType.HEARTBEAT,
      channelId: 0,
      sequence: 1,
      payload: new Uint8Array(0),
    };

    const encoded = encodeFrame(frame);
    expect(encoded.byteLength).toBe(HEADER_SIZE_BYTES);

    const decoded = decodeFrame(encoded);
    expect(decoded.type).toBe(FrameType.HEARTBEAT);
    expect(decoded.payload.byteLength).toBe(0);
  });

  it("throws on truncated buffer smaller than header", () => {
    const truncated = new Uint8Array(5);
    expect(() => decodeFrame(truncated)).toThrow(
      /smaller than required header size/,
    );
  });

  it("throws on invalid magic byte", () => {
    const invalid = new Uint8Array(HEADER_SIZE_BYTES);
    invalid[0] = 0x99; // invalid magic
    expect(() => decodeFrame(invalid)).toThrow(/Invalid magic byte/);
  });
});
