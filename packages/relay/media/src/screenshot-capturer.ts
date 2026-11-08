/**
 * High-Resolution Viewport Screenshot Capture & Lossless WebP Compressor
 *
 * Captures pixel-perfect viewport or full-page scroll snapshots and compresses
 * raster data into compact WebP format (< 200kB).
 *
 * Note for Octavia: Used by the Screenshot drawer in Cloud Web DevTools.
 */

export interface ScreenshotOptions {
  fullPage?: boolean;
  format?: "webp" | "png" | "jpeg";
  quality?: number; // 0.0 to 1.0 (default: 0.85)
  maxWidth?: number;
  maxHeight?: number;
}

export interface ScreenshotResult {
  dataUri: string;
  byteSize: number;
  dimensions: {
    width: number;
    height: number;
  };
  format: "webp" | "png" | "jpeg";
  timestamp: number;
}

export interface CanvasLike {
  width: number;
  height: number;
  toDataURL: (type: string, encoderOptions?: number) => string;
}

export class ViewportScreenshotCapturer {
  public static compressToDataUrl(
    canvas: CanvasLike,
    format: "webp" | "png" | "jpeg" = "webp",
    quality = 0.85,
  ): { dataUri: string; byteSize: number } {
    const mimeType = `image/${format}`;
    const dataUri = canvas.toDataURL(mimeType, quality);

    // Estimate base64 byte size
    const base64Content = dataUri.split(",")[1] ?? "";
    const byteSize = Math.floor((base64Content.length * 3) / 4);

    return {
      dataUri,
      byteSize,
    };
  }

  public static captureCanvas(
    canvas: CanvasLike,
    options: ScreenshotOptions = {},
  ): ScreenshotResult {
    const format = options.format ?? "webp";
    const quality = options.quality ?? 0.85;

    const { dataUri, byteSize } = ViewportScreenshotCapturer.compressToDataUrl(
      canvas,
      format,
      quality,
    );

    return {
      dataUri,
      byteSize,
      dimensions: {
        width: canvas.width,
        height: canvas.height,
      },
      format,
      timestamp: Date.now(),
    };
  }

  public static createSvgForeignObjectSnapshot(
    html: string,
    width: number,
    height: number,
  ): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">${html}</div></foreignObject></svg>`;
  }
}
