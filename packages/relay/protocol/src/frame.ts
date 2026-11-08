import { RelayProtocolError } from "./errors.js";

export const FRAME_MAGIC_BYTE = 0x52; // ASCII 'R'
export const PROTOCOL_VERSION = 0x01;
export const HEADER_SIZE_BYTES = 12;
export const MAX_PAYLOAD_SIZE_BYTES = 16 * 1024 * 1024; // 16 MB limit

export enum FrameType {
  CONTROL = 0x01,
  EVENT = 0x02,
  STREAM = 0x03,
  HEARTBEAT = 0x04,
}

export interface RelayFrame {
  version: number;
  type: FrameType;
  channelId: number;
  sequence: number;
  payload: Uint8Array;
}

/**
 * Serializes a RelayFrame into a binary Buffer.
 */
export function encodeFrame(frame: RelayFrame): Uint8Array {
  if (frame.payload.byteLength > MAX_PAYLOAD_SIZE_BYTES) {
    throw new RelayProtocolError(
      "ERR_FRAME_TOO_LARGE",
      `Payload size ${frame.payload.byteLength} exceeds limit of ${MAX_PAYLOAD_SIZE_BYTES} bytes`,
    );
  }

  const totalLength = HEADER_SIZE_BYTES + frame.payload.byteLength;
  const buffer = new Uint8Array(totalLength);
  const view = new DataView(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength,
  );

  // Offset 0: Magic byte
  view.setUint8(0, FRAME_MAGIC_BYTE);
  // Offset 1: Version
  view.setUint8(1, frame.version || PROTOCOL_VERSION);
  // Offset 2: FrameType
  view.setUint8(2, frame.type);
  // Offset 3: ChannelId
  view.setUint8(3, frame.channelId);
  // Offset 4: Sequence (uint32 BE)
  view.setUint32(4, frame.sequence, false);
  // Offset 8: PayloadLength (uint32 BE)
  view.setUint32(8, frame.payload.byteLength, false);

  // Payload
  buffer.set(frame.payload, HEADER_SIZE_BYTES);

  return buffer;
}

/**
 * Deserializes a binary buffer into a RelayFrame.
 */
export function decodeFrame(data: Uint8Array): RelayFrame {
  if (data.byteLength < HEADER_SIZE_BYTES) {
    throw new RelayProtocolError(
      "ERR_FRAME_CORRUPT",
      `Buffer length ${data.byteLength} is smaller than required header size ${HEADER_SIZE_BYTES}`,
    );
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  const magic = view.getUint8(0);
  if (magic !== FRAME_MAGIC_BYTE) {
    throw new RelayProtocolError(
      "ERR_FRAME_CORRUPT",
      `Invalid magic byte 0x${magic.toString(16)}. Expected 0x${FRAME_MAGIC_BYTE.toString(16)}`,
    );
  }

  const version = view.getUint8(1);
  if (version !== PROTOCOL_VERSION) {
    throw new RelayProtocolError(
      "ERR_VERSION_MISMATCH",
      `Unsupported protocol version ${version}. Expected ${PROTOCOL_VERSION}`,
    );
  }

  const rawType = view.getUint8(2);
  if (!Object.values(FrameType).includes(rawType as FrameType)) {
    throw new RelayProtocolError(
      "ERR_FRAME_CORRUPT",
      `Unknown frame type 0x${rawType.toString(16)}`,
    );
  }
  const type = rawType as FrameType;

  const channelId = view.getUint8(3);
  const sequence = view.getUint32(4, false);
  const payloadLength = view.getUint32(8, false);

  if (payloadLength > MAX_PAYLOAD_SIZE_BYTES) {
    throw new RelayProtocolError(
      "ERR_FRAME_TOO_LARGE",
      `Declared payload length ${payloadLength} exceeds maximum limit ${MAX_PAYLOAD_SIZE_BYTES}`,
    );
  }

  const expectedTotal = HEADER_SIZE_BYTES + payloadLength;
  if (data.byteLength < expectedTotal) {
    throw new RelayProtocolError(
      "ERR_FRAME_CORRUPT",
      `Truncated frame: expected ${expectedTotal} bytes, received ${data.byteLength}`,
    );
  }

  const payload = data.subarray(HEADER_SIZE_BYTES, expectedTotal);

  return {
    version,
    type,
    channelId,
    sequence,
    payload,
  };
}
