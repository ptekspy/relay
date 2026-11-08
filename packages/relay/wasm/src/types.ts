/**
 * @paddy-systems/relay-wasm
 * Types for WebAssembly accelerated modules.
 */

export interface WasmAccelerationCapabilities {
  hasWasm: boolean;
  hasSimd: boolean;
  hasSharedArrayBuffer: boolean;
  activeEngine: "wasm-simd" | "wasm-standard" | "javascript-fallback";
}

export interface BinaryFrameHeader {
  magicByte: number; // 0x52 ('R')
  version: number;
  messageType: number;
  payloadLength: number;
  checksum: number;
  isCompressed: boolean;
}

export interface WasmBenchmarkResult {
  operation: string;
  jsOpsPerSec: number;
  wasmOpsPerSec: number;
  speedupFactor: number;
}
