import type { BinaryFrameHeader } from "./types.js";

export class WasmFrameHeaderParser {
  public static readonly MAGIC_BYTE = 0x52; // 'R'

  public parseHeader(bytes: Uint8Array): BinaryFrameHeader {
    if (bytes.length < 12) {
      throw new Error(
        `Frame buffer too small: expected >= 12 bytes, got ${bytes.length}`,
      );
    }

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const magic = view.getUint8(0);
    if (magic !== WasmFrameHeaderParser.MAGIC_BYTE) {
      throw new Error(
        `Invalid frame magic byte: 0x${magic.toString(16)} (expected 0x52)`,
      );
    }

    const version = view.getUint8(1);
    const messageType = view.getUint8(2);
    const flags = view.getUint8(3);
    const payloadLength = view.getUint32(4, false); // big-endian
    const checksum = view.getUint32(8, false);

    return {
      magicByte: magic,
      version,
      messageType,
      payloadLength,
      checksum,
      isCompressed: (flags & 0x01) === 0x01,
    };
  }

  public serializeHeader(header: BinaryFrameHeader): Uint8Array {
    const bytes = new Uint8Array(12);
    const view = new DataView(bytes.buffer);

    view.setUint8(0, WasmFrameHeaderParser.MAGIC_BYTE);
    view.setUint8(1, header.version);
    view.setUint8(2, header.messageType);
    view.setUint8(3, header.isCompressed ? 0x01 : 0x00);
    view.setUint32(4, header.payloadLength, false);
    view.setUint32(8, header.checksum, false);

    return bytes;
  }
}

export const wasmFrameHeaderParser = new WasmFrameHeaderParser();
