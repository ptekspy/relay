import zlib from "node:zlib";
import type { RecordedEvent } from "./types.js";

const MAGIC_BYTES = Buffer.from([0x50, 0x53, 0x52, 0x43]); // PSRC

export class RecordingStorageEngine {
  public compressEvents(
    events: RecordedEvent[],
    chunkIndex: number,
  ): Uint8Array {
    const jsonStr = JSON.stringify(events);
    const rawBytes = Buffer.from(jsonStr, "utf-8");
    const compressed = zlib.gzipSync(rawBytes, { level: 6 });

    // Header: [Magic 4B][ChunkIndex 4B][UncompressedLen 4B][Payload NB]
    const header = Buffer.alloc(12);
    MAGIC_BYTES.copy(header, 0);
    header.writeUInt32BE(chunkIndex, 4);
    header.writeUInt32BE(rawBytes.length, 8);

    return new Uint8Array(Buffer.concat([header, compressed]));
  }

  public decompressEvents(chunk: Uint8Array): RecordedEvent[] {
    if (chunk.byteLength < 12) {
      throw new Error("Invalid chunk: shorter than 12-byte header");
    }

    const buf = Buffer.from(chunk);
    if (!buf.subarray(0, 4).equals(MAGIC_BYTES)) {
      throw new Error(
        "Invalid magic bytes: not a Paddy Systems recording chunk",
      );
    }

    const payload = buf.subarray(12);
    const uncompressed = zlib.gunzipSync(payload);
    const jsonStr = uncompressed.toString("utf-8");

    return JSON.parse(jsonStr) as RecordedEvent[];
  }
}

export class RecordingChunkBuffer {
  private buffer: RecordedEvent[] = [];
  private chunks: Uint8Array[] = [];
  private readonly batchSize: number;
  private readonly storageEngine = new RecordingStorageEngine();

  constructor(batchSize = 50) {
    this.batchSize = batchSize;
  }

  public append(event: RecordedEvent): Uint8Array | null {
    this.buffer.push(event);
    if (this.buffer.length >= this.batchSize) {
      return this.flush();
    }
    return null;
  }

  public flush(): Uint8Array | null {
    if (this.buffer.length === 0) return null;
    const chunk = this.storageEngine.compressEvents(
      this.buffer,
      this.chunks.length,
    );
    this.chunks.push(chunk);
    this.buffer = [];
    return chunk;
  }

  public get completedChunks(): Uint8Array[] {
    return [...this.chunks];
  }
}
