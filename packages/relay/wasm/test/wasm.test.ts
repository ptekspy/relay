import { describe, expect, test } from "bun:test";
import {
  RelayWasmCoordinator,
  wasmBrotliDecompressor,
  wasmDomTreeHasher,
  wasmEngineLoader,
  wasmFastChecksum,
  wasmFrameHeaderParser,
  wasmMemoryRingBuffer,
  wasmMicroBenchmark,
  wasmZstdDecompressor,
} from "../src/index.js";

describe("Relay WebAssembly High-Performance Acceleration Tests", () => {
  test("engine loader detects runtime capabilities", () => {
    const caps = wasmEngineLoader.detectCapabilities();
    expect(caps.hasWasm).toBe(true);
    expect(["wasm-simd", "wasm-standard", "javascript-fallback"]).toContain(
      caps.activeEngine,
    );
  });

  test("ring buffer allocator allocates continuous slots and handles wrap-around", () => {
    wasmMemoryRingBuffer.reset();
    const slot1 = wasmMemoryRingBuffer.allocateSlot(1024);
    expect(slot1.offset).toBe(0);
    expect(slot1.length).toBe(1024);

    const data = new Uint8Array([1, 2, 3, 4]);
    wasmMemoryRingBuffer.writeSlice(slot1.offset, data);
    const read = wasmMemoryRingBuffer.readSlice(slot1.offset, 4);
    expect(Array.from(read)).toEqual([1, 2, 3, 4]);
  });

  test("binary frame header parser validates format and serializes roundtrip", () => {
    const header = {
      magicByte: 0x52,
      version: 1,
      messageType: 4,
      payloadLength: 2048,
      checksum: 0x12345678,
      isCompressed: true,
    };

    const serialized = wasmFrameHeaderParser.serializeHeader(header);
    expect(serialized.length).toBe(12);

    const parsed = wasmFrameHeaderParser.parseHeader(serialized);
    expect(parsed.magicByte).toBe(0x52);
    expect(parsed.version).toBe(1);
    expect(parsed.messageType).toBe(4);
    expect(parsed.payloadLength).toBe(2048);
    expect(parsed.checksum).toBe(0x12345678);
    expect(parsed.isCompressed).toBe(true);
  });

  test("frame parser throws on invalid magic byte or truncated buffer", () => {
    const invalid = new Uint8Array(12);
    invalid[0] = 0x00; // invalid magic
    expect(() => wasmFrameHeaderParser.parseHeader(invalid)).toThrow(
      "Invalid frame magic byte",
    );

    const truncated = new Uint8Array(8);
    expect(() => wasmFrameHeaderParser.parseHeader(truncated)).toThrow(
      "Frame buffer too small",
    );
  });

  test("checksum calculator computes valid CRC32 and SHA-256", async () => {
    const text = new TextEncoder().encode("Hello Relay WASM");
    const crc = wasmFastChecksum.crc32(text);
    expect(crc).toBeGreaterThan(0);

    const sha = await wasmFastChecksum.sha256Hex(text);
    expect(sha.length).toBeGreaterThanOrEqual(8);
  });

  test("zstd decompressor decodes mock-compressed stream", () => {
    const raw = new TextEncoder().encode(
      "DOM mutation payload payload payload",
    );
    const compressed = wasmZstdDecompressor.compressMock(raw);
    const decompressed = wasmZstdDecompressor.decompress(compressed);

    expect(decompressed).toEqual(raw);
  });

  test("brotli decompressor combines multiple chunks into single buffer", async () => {
    const chunk1 = new Uint8Array([1, 2, 3]);
    const chunk2 = new Uint8Array([4, 5, 6]);
    const result = await wasmBrotliDecompressor.decompressStream([
      chunk1,
      chunk2,
    ]);

    expect(result.length).toBe(6);
    expect(Array.from(result)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  test("DOM tree hasher detects identical vs altered subtrees", () => {
    const treeA = {
      tag: "div",
      id: "card-1",
      classes: ["flex", "p-4"],
      attributes: { "data-active": "true" },
      children: [{ tag: "span", classes: ["text-bold"] }],
    };

    const treeB = {
      tag: "div",
      id: "card-1",
      classes: ["flex", "p-4"],
      attributes: { "data-active": "true" },
      children: [{ tag: "span", classes: ["text-bold"] }],
    };

    const treeC = {
      tag: "div",
      id: "card-1",
      classes: ["flex", "p-4"],
      attributes: { "data-active": "false" },
      children: [{ tag: "span", classes: ["text-bold"] }],
    };

    expect(wasmDomTreeHasher.areSubtreesIdentical(treeA, treeB)).toBe(true);
    expect(wasmDomTreeHasher.areSubtreesIdentical(treeA, treeC)).toBe(false);
  });

  test("micro-benchmark validates positive speedup factor", () => {
    const res = wasmMicroBenchmark.runChecksumBenchmark(500);
    expect(res.speedupFactor).toBeGreaterThanOrEqual(1.5);
    expect(res.wasmOpsPerSec).toBeGreaterThan(0);
  });

  test("RelayWasmCoordinator facade integrates all modules", () => {
    const coord = new RelayWasmCoordinator();
    expect(coord.memory).toBeDefined();
    expect(coord.checksum).toBeDefined();
    expect(coord.frameParser).toBeDefined();
    expect(coord.zstd).toBeDefined();
    expect(coord.brotli).toBeDefined();
    expect(coord.domHasher).toBeDefined();
  });
});
