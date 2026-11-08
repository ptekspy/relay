export class WasmFastChecksum {
  private static readonly CRC32_TABLE: Uint32Array = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[i] = c >>> 0;
    }
    return table;
  })();

  public crc32(buffer: Uint8Array): number {
    let crc = 0xffffffff;
    const table = WasmFastChecksum.CRC32_TABLE;
    const len = buffer.length;

    for (let i = 0; i < len; i++) {
      const byte = buffer[i]!;
      crc = (table[(crc ^ byte) & 0xff]! ^ (crc >>> 8)) >>> 0;
    }

    return (crc ^ 0xffffffff) >>> 0;
  }

  public async sha256Hex(buffer: Uint8Array): Promise<string> {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const hashBuf = await crypto.subtle.digest(
        "SHA-256",
        buffer as unknown as ArrayBufferView<ArrayBuffer>,
      );
      const hashArr = Array.from(new Uint8Array(hashBuf));
      return hashArr.map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    // Software fallback
    let h = 0x811c9dc5;
    for (let i = 0; i < buffer.length; i++) {
      h ^= buffer[i]!;
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, "0");
  }
}

export const wasmFastChecksum = new WasmFastChecksum();
