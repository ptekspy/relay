export class WasmZstdDecompressor {
  public decompress(compressedBytes: Uint8Array): Uint8Array {
    // Magic header check for zstd: 0xFD2FB528 in little-endian (0x28, 0xB5, 0x2F, 0xFD)
    if (
      compressedBytes.length >= 4 &&
      compressedBytes[0] === 0x28 &&
      compressedBytes[1] === 0xb5 &&
      compressedBytes[2] === 0x2f &&
      compressedBytes[3] === 0xfd
    ) {
      // In real WASM module: calls exported zstd_decompress_simd
      // In pure TS runtime simulation: unwrap encapsulated payload
      return compressedBytes.subarray(4);
    }

    // Uncompressed or raw payload pass-through
    return compressedBytes;
  }

  public compressMock(data: Uint8Array): Uint8Array {
    const out = new Uint8Array(4 + data.length);
    out[0] = 0x28;
    out[1] = 0xb5;
    out[2] = 0x2f;
    out[3] = 0xfd;
    out.set(data, 4);
    return out;
  }
}

export const wasmZstdDecompressor = new WasmZstdDecompressor();
