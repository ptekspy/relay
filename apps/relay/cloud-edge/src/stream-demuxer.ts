/**
 * High-Throughput HTTP Stream Multiplexer & Demultiplexer for Tunnels
 *
 * Multiplexes concurrent HTTP/1.1 and HTTP/2 request/response streams over a single
 * persistent tunnel connection without head-of-line blocking or byte corruption.
 *
 * Note for Octavia: This demuxer manages multiplexed stream ID channels over the edge tunnel.
 */

export type StreamCompressionEncoding = "identity" | "gzip" | "br" | "deflate";

export interface StreamHeaders {
  streamId: number;
  method: string;
  path: string;
  headers: Record<string, string>;
  encoding?: StreamCompressionEncoding;
}

export interface StreamChunk {
  streamId: number;
  data: Uint8Array;
  isEnd: boolean;
}

export interface StreamResponse {
  streamId: number;
  statusCode: number;
  headers: Record<string, string>;
  encoding?: StreamCompressionEncoding;
}

export interface ActiveStreamHandler {
  onHeaders?: (headers: StreamHeaders | StreamResponse) => void;
  onChunk: (chunk: Uint8Array) => void;
  onEnd: () => void;
  onError: (error: Error) => void;
}

export class TunnelStreamDemuxer {
  private nextStreamId = 1;
  private readonly activeStreams = new Map<number, ActiveStreamHandler>();
  private readonly completedStreams = new Set<number>();

  public createStreamId(): number {
    const id = this.nextStreamId++;
    if (this.nextStreamId > 0x7fffffff) {
      this.nextStreamId = 1;
    }
    return id;
  }

  public registerStream(streamId: number, handler: ActiveStreamHandler): void {
    this.activeStreams.set(streamId, handler);
  }

  public unregisterStream(streamId: number): void {
    this.activeStreams.delete(streamId);
  }

  public getActiveStreamCount(): number {
    return this.activeStreams.size;
  }

  public handleIncomingChunk(chunk: StreamChunk): void {
    const handler = this.activeStreams.get(chunk.streamId);
    if (!handler) {
      // If stream already completed or unknown, ignore cleanly
      return;
    }

    if (chunk.data.length > 0) {
      handler.onChunk(chunk.data);
    }

    if (chunk.isEnd) {
      handler.onEnd();
      this.activeStreams.delete(chunk.streamId);
      this.completedStreams.add(chunk.streamId);
    }
  }

  public handleStreamError(streamId: number, error: Error): void {
    const handler = this.activeStreams.get(streamId);
    if (handler) {
      handler.onError(error);
      this.activeStreams.delete(streamId);
    }
  }

  /**
   * Encodes a chunk into a compact binary frame:
   * [4 bytes: streamId (Uint32BE)][1 byte: flags (bit 0 = isEnd)][remaining: payload]
   */
  public static encodeFrame(
    streamId: number,
    data: Uint8Array,
    isEnd: boolean,
  ): Uint8Array {
    const frame = new Uint8Array(5 + data.length);
    const view = new DataView(frame.buffer, frame.byteOffset, frame.byteLength);

    view.setUint32(0, streamId, false); // Big endian
    view.setUint8(4, isEnd ? 1 : 0);
    frame.set(data, 5);

    return frame;
  }

  /**
   * Decodes a binary frame back into StreamChunk
   */
  public static decodeFrame(frame: Uint8Array): StreamChunk {
    if (frame.length < 5) {
      throw new Error(
        `Invalid frame: length ${frame.length} is less than header size 5`,
      );
    }

    const view = new DataView(frame.buffer, frame.byteOffset, frame.byteLength);
    const streamId = view.getUint32(0, false);
    const flags = view.getUint8(4);
    const isEnd = (flags & 1) === 1;
    const data = frame.subarray(5);

    return {
      streamId,
      data,
      isEnd,
    };
  }
}
