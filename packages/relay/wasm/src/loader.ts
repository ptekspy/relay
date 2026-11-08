import type { WasmAccelerationCapabilities } from "./types.js";

export class WasmEngineLoader {
  public detectCapabilities(): WasmAccelerationCapabilities {
    let hasWasm = false;
    let hasSimd = false;
    let hasSharedArrayBuffer = false;

    if (typeof WebAssembly !== "undefined") {
      hasWasm = true;
      try {
        // SIMD validation bytecode probe
        hasSimd = WebAssembly.validate(
          new Uint8Array([
            0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x05, 0x01,
            0x60, 0x00, 0x01, 0x7b, 0x03, 0x02, 0x01, 0x00, 0x0a, 0x0a, 0x01,
            0x08, 0x00, 0xfd, 0x0c, 0x00, 0x00, 0x00, 0x00, 0x0b,
          ]),
        );
      } catch {
        hasSimd = false;
      }
    }

    if (typeof SharedArrayBuffer !== "undefined") {
      hasSharedArrayBuffer = true;
    }

    let activeEngine: WasmAccelerationCapabilities["activeEngine"] =
      "javascript-fallback";
    if (hasWasm && hasSimd) {
      activeEngine = "wasm-simd";
    } else if (hasWasm) {
      activeEngine = "wasm-standard";
    }

    return {
      hasWasm,
      hasSimd,
      hasSharedArrayBuffer,
      activeEngine,
    };
  }
}

export const wasmEngineLoader = new WasmEngineLoader();
