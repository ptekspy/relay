import zlib from "node:zlib";

export class StreamCompressor {
  private readonly thresholdBytes: number;

  constructor(thresholdBytes = 256) {
    this.thresholdBytes = thresholdBytes;
  }

  public compress(data: Uint8Array): Uint8Array {
    if (data.byteLength < this.thresholdBytes) {
      // Uncompressed marker 0x00
      const result = new Uint8Array(data.byteLength + 1);
      result[0] = 0x00;
      result.set(data, 1);
      return result;
    }

    const compressed = zlib.gzipSync(Buffer.from(data), { level: 6 });
    // Compressed marker 0x01
    const result = new Uint8Array(compressed.byteLength + 1);
    result[0] = 0x01;
    result.set(compressed, 1);
    return result;
  }

  public decompress(data: Uint8Array): Uint8Array {
    if (data.byteLength < 1) {
      return data;
    }

    const flag = data[0];
    if (flag === undefined) {
      return data;
    }
    const payload = data.subarray(1);

    if (flag === 0x00) {
      return payload;
    }

    if (flag === 0x01) {
      const decompressed = zlib.gunzipSync(Buffer.from(payload));
      return new Uint8Array(decompressed);
    }

    throw new Error(`Unsupported compression flag: 0x${flag.toString(16)}`);
  }
}
