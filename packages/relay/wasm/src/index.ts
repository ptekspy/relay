/**
 * @paddy-systems/relay-wasm
 * WebAssembly High-Performance Acceleration Modules.
 */

export * from "./benchmark.js";
export * from "./brotli-decompressor.js";
export * from "./checksum.js";
export * from "./dom-tree-hash.js";
export * from "./frame-parser.js";
export * from "./loader.js";
export * from "./memory-allocator.js";
export * from "./types.js";
export * from "./zstd-decompressor.js";

import { wasmMicroBenchmark } from "./benchmark.js";
import { wasmBrotliDecompressor } from "./brotli-decompressor.js";
import { wasmFastChecksum } from "./checksum.js";
import { wasmDomTreeHasher } from "./dom-tree-hash.js";
import { wasmFrameHeaderParser } from "./frame-parser.js";
import { wasmEngineLoader } from "./loader.js";
import { wasmMemoryRingBuffer } from "./memory-allocator.js";
import { wasmZstdDecompressor } from "./zstd-decompressor.js";

export class RelayWasmCoordinator {
  public memory = wasmMemoryRingBuffer;
  public checksum = wasmFastChecksum;
  public frameParser = wasmFrameHeaderParser;
  public zstd = wasmZstdDecompressor;
  public brotli = wasmBrotliDecompressor;
  public domHasher = wasmDomTreeHasher;
  public loader = wasmEngineLoader;
  public benchmark = wasmMicroBenchmark;
}
