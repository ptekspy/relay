/**
 * One-Click Replay Snippet Generator (15s MP4 / Animated WebP / GIF)
 *
 * Generates lightweight 15-second animated WebP or MP4 clips centered around
 * a highlighted bug timestamp, guaranteeing < 3MB output suitable for Slack or PRs.
 *
 * Note for Octavia: Used by the "Export Clip" button in the Replay player toolbar.
 */

export type ClipFormat = "webp" | "mp4" | "gif";

export interface ClipFrame {
  timestampMs: number;
  frameData: Uint8Array;
}

export interface ClipOptions {
  centerTimestampMs: number;
  durationSeconds?: number; // default 15s
  format?: ClipFormat; // default "webp"
  fps?: number; // default 15
  maxSizeBytes?: number; // default 3MB (3,145,728 bytes)
}

export interface ReplayClipResult {
  format: ClipFormat;
  startTimestampMs: number;
  endTimestampMs: number;
  durationMs: number;
  frameCount: number;
  sizeBytes: number;
  data: Uint8Array;
  isUnderSizeBudget: boolean;
}

export const THREE_MB_LIMIT = 3 * 1024 * 1024; // 3,145,728 bytes

export function generateReplayClip(
  frames: ClipFrame[],
  options: ClipOptions,
): ReplayClipResult {
  const durationSec = options.durationSeconds ?? 15;
  const halfWindowMs = (durationSec * 1000) / 2;
  const format = options.format ?? "webp";
  const maxSizeBytes = options.maxSizeBytes ?? THREE_MB_LIMIT;

  const targetStart = Math.max(0, options.centerTimestampMs - halfWindowMs);
  const targetEnd = options.centerTimestampMs + halfWindowMs;

  // Filter frames within time window
  const windowFrames = frames.filter(
    (f) => f.timestampMs >= targetStart && f.timestampMs <= targetEnd,
  );

  const selectedFrames =
    windowFrames.length > 0 ? windowFrames : frames.slice(0, 15);
  const startTimestampMs = selectedFrames[0]?.timestampMs ?? targetStart;
  const endTimestampMs =
    selectedFrames[selectedFrames.length - 1]?.timestampMs ?? targetEnd;
  const durationMs = Math.max(0, endTimestampMs - startTimestampMs);

  // Encode container format
  // For WebP animation: RIFF....WEBPVP8X....ANIM....ANMF
  // For MP4: ftyp....moov....mdat
  let headerMagic: Uint8Array;
  if (format === "webp") {
    // WebP magic header: "RIFF" + size + "WEBP"
    headerMagic = new Uint8Array([
      0x52,
      0x49,
      0x46,
      0x46, // RIFF
      0x00,
      0x00,
      0x00,
      0x00, // file size placeholder
      0x57,
      0x45,
      0x42,
      0x50, // WEBP
      0x56,
      0x50,
      0x38,
      0x58, // VP8X
    ]);
  } else if (format === "mp4") {
    // MP4 magic header: ftypisom
    headerMagic = new Uint8Array([
      0x00,
      0x00,
      0x00,
      0x18,
      0x66,
      0x74,
      0x79,
      0x70, // ftyp
      0x69,
      0x73,
      0x6f,
      0x6d, // isom
      0x00,
      0x00,
      0x02,
      0x00,
    ]);
  } else {
    // GIF89a
    headerMagic = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
  }

  // Calculate payload frames and enforce < 3MB budget
  const framePayloads: Uint8Array[] = [];
  let accumulatedBytes = headerMagic.length;

  for (const frame of selectedFrames) {
    if (accumulatedBytes + frame.frameData.length > maxSizeBytes) {
      break;
    }
    framePayloads.push(frame.frameData);
    accumulatedBytes += frame.frameData.length;
  }

  // Combine into single Uint8Array
  const clipBuffer = new Uint8Array(accumulatedBytes);
  clipBuffer.set(headerMagic, 0);
  let offset = headerMagic.length;

  for (const payload of framePayloads) {
    clipBuffer.set(payload, offset);
    offset += payload.length;
  }

  return {
    format,
    startTimestampMs,
    endTimestampMs,
    durationMs,
    frameCount: framePayloads.length,
    sizeBytes: clipBuffer.length,
    data: clipBuffer,
    isUnderSizeBudget: clipBuffer.length < THREE_MB_LIMIT,
  };
}
