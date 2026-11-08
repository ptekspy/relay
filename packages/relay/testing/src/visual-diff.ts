/**
 * Automated Cross-Device Visual Regression Screenshot Diffing
 *
 * Compares baseline and candidate screenshots across connected mobile devices,
 * computing per-pixel RGBA color distance and producing a highlighted diff overlay.
 *
 * Note for Octavia: Exported from @paddy-systems/relay-testing/visual-diff.
 */

export interface VisualDiffOptions {
  threshold?: number; // 0.0 to 1.0 color delta tolerance per pixel
  maxDiffPercentage?: number; // Maximum allowed percentage of changed pixels (e.g. 0.01 = 1%)
  diffColor?: { r: number; g: number; b: number; a: number };
}

export interface VisualDiffResult {
  match: boolean;
  totalPixels: number;
  diffPixels: number;
  diffPercentage: number;
  diffBuffer: Uint8Array;
  deviceName?: string;
}

export class VisualDiffComparator {
  public defaultThreshold = 0.05; // 5% color distance
  public defaultMaxDiffPercentage = 0.005; // 0.5% screen threshold

  constructor(threshold = 0.05, maxDiffPercentage = 0.005) {
    this.defaultThreshold = threshold;
    this.defaultMaxDiffPercentage = maxDiffPercentage;
  }

  public compareRgba(
    baseline: Uint8Array,
    candidate: Uint8Array,
    width: number,
    height: number,
    options?: VisualDiffOptions,
  ): VisualDiffResult {
    const threshold = options?.threshold ?? this.defaultThreshold;
    const maxDiffPercentage =
      options?.maxDiffPercentage ?? this.defaultMaxDiffPercentage;
    const diffColor = options?.diffColor ?? {
      r: 255,
      g: 0,
      b: 102,
      a: 255,
    }; // Neon Magenta

    const totalPixels = width * height;
    const byteLength = totalPixels * 4;
    const diffBuffer = new Uint8Array(byteLength);

    let diffPixels = 0;
    const maxDelta = Math.sqrt(255 * 255 * 3);

    for (let i = 0; i < byteLength; i += 4) {
      const r1 = baseline[i] ?? 0;
      const g1 = baseline[i + 1] ?? 0;
      const b1 = baseline[i + 2] ?? 0;

      const r2 = candidate[i] ?? 0;
      const g2 = candidate[i + 1] ?? 0;
      const b2 = candidate[i + 2] ?? 0;

      const delta =
        Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2) / maxDelta;

      if (delta > threshold) {
        diffPixels++;
        // Highlight in neon diff color
        diffBuffer[i] = diffColor.r;
        diffBuffer[i + 1] = diffColor.g;
        diffBuffer[i + 2] = diffColor.b;
        diffBuffer[i + 3] = diffColor.a;
      } else {
        // Dim unchanged pixels to grayscale backdrop
        const gray = Math.round((r1 * 0.299 + g1 * 0.587 + b1 * 0.114) * 0.4);
        diffBuffer[i] = gray;
        diffBuffer[i + 1] = gray;
        diffBuffer[i + 2] = gray;
        diffBuffer[i + 3] = 255;
      }
    }

    const diffPercentage = totalPixels > 0 ? diffPixels / totalPixels : 0;
    const match = diffPercentage <= maxDiffPercentage;

    return {
      match,
      totalPixels,
      diffPixels,
      diffPercentage,
      diffBuffer,
    };
  }

  public compareDeviceMatrix(
    matrix: Array<{
      deviceName: string;
      baseline: Uint8Array;
      candidate: Uint8Array;
      width: number;
      height: number;
    }>,
    options?: VisualDiffOptions,
  ): Record<string, VisualDiffResult> {
    const results: Record<string, VisualDiffResult> = {};
    for (const item of matrix) {
      const res = this.compareRgba(
        item.baseline,
        item.candidate,
        item.width,
        item.height,
        options,
      );
      res.deviceName = item.deviceName;
      results[item.deviceName] = res;
    }
    return results;
  }
}
