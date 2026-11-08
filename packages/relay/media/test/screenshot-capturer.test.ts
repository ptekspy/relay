import { describe, expect, it } from "bun:test";
import {
  type CanvasLike,
  ViewportScreenshotCapturer,
} from "../src/screenshot-capturer.js";

describe("TASK-156: High-Resolution Viewport Screenshot Capture & Lossless WebP Compressor", () => {
  it("captures canvas snapshot and compresses to WebP under 200kB", () => {
    // Mock 1080p canvas producing mock WebP data URI
    const mockData = "A".repeat(80000); // ~60kB binary payload
    const mockCanvas: CanvasLike = {
      width: 1920,
      height: 1080,
      toDataURL: (type: string, quality = 0.85) => {
        expect(type).toBe("image/webp");
        expect(quality).toBe(0.85);
        return `data:image/webp;base64,${mockData}`;
      },
    };

    const result = ViewportScreenshotCapturer.captureCanvas(mockCanvas, {
      format: "webp",
      quality: 0.85,
    });

    expect(result.format).toBe("webp");
    expect(result.dimensions).toEqual({ width: 1920, height: 1080 });
    expect(result.byteSize).toBe(60000);
    expect(result.byteSize).toBeLessThan(200 * 1024); // Under 200kB requirement
    expect(result.dataUri).toContain("data:image/webp;base64,");
  });

  it("generates SVG foreignObject container for DOM snapshot rasterization", () => {
    const html = `<div class="container"><h1>Hello Relay</h1></div>`;
    const svg = ViewportScreenshotCapturer.createSvgForeignObjectSnapshot(
      html,
      1280,
      800,
    );

    expect(svg).toContain(`xmlns="http://www.w3.org/2000/svg"`);
    expect(svg).toContain(`width="1280" height="800"`);
    expect(svg).toContain(`<foreignObject width="100%" height="100%">`);
    expect(svg).toContain(html);
  });
});
