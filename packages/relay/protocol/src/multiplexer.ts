import { RelayProtocolError } from "./errors.js";
import {
  decodeFrame,
  encodeFrame,
  FRAME_MAGIC_BYTE,
  type FrameType,
  HEADER_SIZE_BYTES,
  MAX_PAYLOAD_SIZE_BYTES,
  type RelayFrame,
} from "./frame.js";

export const CHANNEL_CONTROL = 0;
export const CHANNEL_PROXY = 1;
export const CHANNEL_TELEMETRY = 2;
export const CHANNEL_HMR = 3;

export type FrameHandler = (frame: RelayFrame) => void;
export type RawSendFunction = (data: Uint8Array) => Promise<void> | void;

export class StreamMultiplexer {
  private sequence = 0;

  constructor(private readonly sendRaw: RawSendFunction) {}

  async send(
    channelId: number,
    type: FrameType,
    payload: Uint8Array,
  ): Promise<number> {
    const seq = this.sequence++;
    const frame: RelayFrame = {
      version: 1,
      type,
      channelId,
      sequence: seq,
      payload,
    };
    const encoded = encodeFrame(frame);
    await this.sendRaw(encoded);
    return seq;
  }
}

export class StreamDemultiplexer {
  private buffer = new Uint8Array(0);
  private readonly channelHandlers: Map<number, Set<FrameHandler>> = new Map();
  private lastReceivedSequence: Map<number, number> = new Map();

  onChannel(channelId: number, handler: FrameHandler): () => void {
    let handlers = this.channelHandlers.get(channelId);
    if (!handlers) {
      handlers = new Set();
      this.channelHandlers.set(channelId, handlers);
    }
    handlers.add(handler);

    return () => {
      handlers.delete(handler);
    };
  }

  /**
   * Pushes incoming raw chunk into accumulator buffer and dispatches any completed frames.
   */
  feed(chunk: Uint8Array): void {
    // Append chunk to buffer
    const nextBuffer = new Uint8Array(
      this.buffer.byteLength + chunk.byteLength,
    );
    nextBuffer.set(this.buffer, 0);
    nextBuffer.set(chunk, this.buffer.byteLength);
    this.buffer = nextBuffer;

    this.processBuffer();
  }

  private processBuffer(): void {
    while (this.buffer.byteLength > 0) {
      // Validate magic byte immediately
      if (this.buffer[0] !== FRAME_MAGIC_BYTE) {
        throw new RelayProtocolError(
          "ERR_FRAME_CORRUPT",
          `Stream synchronization lost: unexpected magic byte 0x${this.buffer[0]?.toString(16)}`,
        );
      }

      if (this.buffer.byteLength < HEADER_SIZE_BYTES) {
        // Need more header bytes
        break;
      }

      const view = new DataView(
        this.buffer.buffer,
        this.buffer.byteOffset,
        this.buffer.byteLength,
      );
      const payloadLength = view.getUint32(8, false);

      if (payloadLength > MAX_PAYLOAD_SIZE_BYTES) {
        throw new RelayProtocolError(
          "ERR_FRAME_TOO_LARGE",
          `Frame declared payload length ${payloadLength} exceeds maximum limit`,
        );
      }

      const totalFrameSize = HEADER_SIZE_BYTES + payloadLength;
      if (this.buffer.byteLength < totalFrameSize) {
        // Need more data from stream
        break;
      }

      // Extract one full frame slice
      const frameData = this.buffer.subarray(0, totalFrameSize);
      this.buffer = this.buffer.subarray(totalFrameSize);

      const frame = decodeFrame(frameData);
      this.dispatchFrame(frame);
    }
  }

  private dispatchFrame(frame: RelayFrame): void {
    this.lastReceivedSequence.set(frame.channelId, frame.sequence);

    const handlers = this.channelHandlers.get(frame.channelId);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(frame);
        } catch (err) {
          console.error(
            `Frame handler on channel ${frame.channelId} failed:`,
            err,
          );
        }
      }
    }
  }
}
