import { describe, expect, it } from "bun:test";
import {
  type Canvas2DContextLike,
  type MaskingRegion,
  PixelStreamRedactor,
} from "../src/pixel-redactor.js";

describe("TASK-158: Redaction of Sensitive Fields in Pixel Stream (Canvas Masking)", () => {
  it("queries sensitive elements from DOM document and derives bounding box regions", () => {
    const mockElements: Record<string, unknown[]> = {
      'input[type="password"]': [
        {
          getBoundingClientRect: () => ({
            left: 100,
            top: 200,
            width: 250,
            height: 40,
          }),
        },
      ],
      "[data-relay-private]": [
        {
          getBoundingClientRect: () => ({
            left: 100,
            top: 300,
            width: 400,
            height: 150,
          }),
        },
      ],
      'input[autocomplete*="cc-"]': [
        {
          getBoundingClientRect: () => ({
            left: 100,
            top: 500,
            width: 200,
            height: 35,
          }),
        },
      ],
    };

    const mockDoc = {
      querySelectorAll: (sel: string) => mockElements[sel] ?? [],
    } as unknown as Document;

    const regions = PixelStreamRedactor.queryMaskingRegions(mockDoc);
    expect(regions.length).toBe(3);

    const passwordRegion = regions.find((r) => r.reason === "password");
    expect(passwordRegion).toBeDefined();
    expect(passwordRegion?.x).toBe(100);
    expect(passwordRegion?.y).toBe(200);
    expect(passwordRegion?.width).toBe(250);

    const privateRegion = regions.find((r) => r.reason === "data-private");
    expect(privateRegion?.height).toBe(150);

    const ccRegion = regions.find((r) => r.reason === "credit-card");
    expect(ccRegion?.y).toBe(500);
  });

  it("applies blackout rectangles onto canvas context", () => {
    const filledRects: Array<{
      x: number;
      y: number;
      w: number;
      h: number;
      fill: string;
    }> = [];
    let currentFill = "";

    const mockCtx: Canvas2DContextLike = {
      set fillStyle(val: string | CanvasGradient | CanvasPattern) {
        currentFill = val as string;
      },
      get fillStyle() {
        return currentFill;
      },
      fillRect: (x, y, w, h) => {
        filledRects.push({ x, y, w, h, fill: currentFill });
      },
      fillText: () => {},
    };

    const regions: MaskingRegion[] = [
      { x: 50, y: 50, width: 200, height: 40, reason: "password" },
      { x: 300, y: 100, width: 150, height: 30, reason: "credit-card" },
    ];

    PixelStreamRedactor.applyMask(mockCtx, regions, { fillColor: "#000000" });

    expect(filledRects.length).toBe(2);
    expect(filledRects[0]?.fill).toBe("#000000");
    expect(filledRects[0]?.x).toBe(50);
    expect(filledRects[1]?.x).toBe(300);
  });
});
