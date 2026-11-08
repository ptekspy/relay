import { describe, expect, it } from "bun:test";
import { VisualDiffComparator } from "../src/visual-diff.js";

describe("TASK-184: Automated Cross-Device Visual Regression Screenshot Diffing", () => {
  const comparator = new VisualDiffComparator();

  it("passes with zero diff pixels on identical frame buffers", () => {
    const width = 10;
    const height = 10;
    const pixels = new Uint8Array(width * height * 4);
    // Fill with white pixels
    pixels.fill(255);

    const result = comparator.compareRgba(pixels, pixels, width, height);
    expect(result.match).toBe(true);
    expect(result.diffPixels).toBe(0);
    expect(result.diffPercentage).toBe(0);
    expect(result.totalPixels).toBe(100);
  });

  it("detects visual deviations and highlights diffs in diffBuffer", () => {
    const width = 20;
    const height = 20;
    const baseline = new Uint8Array(width * height * 4);
    const candidate = new Uint8Array(width * height * 4);

    baseline.fill(255); // White
    candidate.fill(255);

    // Change a 5x5 region in candidate to black (regression)
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const idx = (y * width + x) * 4;
        candidate[idx] = 0;
        candidate[idx + 1] = 0;
        candidate[idx + 2] = 0;
        candidate[idx + 3] = 255;
      }
    }

    const result = comparator.compareRgba(baseline, candidate, width, height, {
      maxDiffPercentage: 0.02, // 2% allowed
    });

    // 25 pixels changed out of 400 = 6.25% > 2% allowed
    expect(result.diffPixels).toBe(25);
    expect(result.diffPercentage).toBe(0.0625);
    expect(result.match).toBe(false);

    // First changed pixel should have diffColor magenta (255, 0, 102)
    expect(result.diffBuffer[0]).toBe(255);
    expect(result.diffBuffer[1]).toBe(0);
    expect(result.diffBuffer[2]).toBe(102);
  });

  it("compares visual regressions across multiple device form factors simultaneously", () => {
    const pixel8Baseline = new Uint8Array(400).fill(255);
    const pixel8Candidate = new Uint8Array(400).fill(255);

    const iphoneBaseline = new Uint8Array(400).fill(255);
    const iphoneCandidate = new Uint8Array(400).fill(255);
    // Introduce regression on iPhone only
    iphoneCandidate[0] = 0;

    const matrixResults = comparator.compareDeviceMatrix([
      {
        deviceName: "Google Pixel 8",
        baseline: pixel8Baseline,
        candidate: pixel8Candidate,
        width: 10,
        height: 10,
      },
      {
        deviceName: "iPhone 15 Pro",
        baseline: iphoneBaseline,
        candidate: iphoneCandidate,
        width: 10,
        height: 10,
      },
    ]);

    expect(matrixResults["Google Pixel 8"]?.match).toBe(true);
    expect(matrixResults["iPhone 15 Pro"]?.diffPixels).toBe(1);
    expect(matrixResults["iPhone 15 Pro"]?.deviceName).toBe("iPhone 15 Pro");
  });
});
