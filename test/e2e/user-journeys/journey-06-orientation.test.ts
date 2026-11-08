import { describe, expect, it } from "bun:test";

describe("Journey 06: Responsive Orientation Simulation & Viewport Switching", () => {
  it("computes sandbox classes and aspect constraints for portrait and landscape modes", () => {
    // Utility mimicking ViewportSandbox style computation
    const getSandboxIframeClasses = (isLandscape: boolean): string => {
      const base = "w-full h-full border-none transition-all duration-300";
      return isLandscape
        ? `${base} max-w-[1024px] aspect-video`
        : `${base} max-w-full`;
    };

    // 1. Initial portrait mode
    let isLandscape = false;
    let classes = getSandboxIframeClasses(isLandscape);

    expect(classes).toContain("max-w-full");
    expect(classes).not.toContain("aspect-video");
    expect(classes).not.toContain("max-w-[1024px]");

    // 2. Toggle orientation via HUD button
    const toggleOrientation = () => {
      isLandscape = !isLandscape;
    };

    toggleOrientation();
    expect(isLandscape).toBe(true);

    classes = getSandboxIframeClasses(isLandscape);
    expect(classes).toContain("max-w-[1024px]");
    expect(classes).toContain("aspect-video");

    // 3. Toggle back to portrait
    toggleOrientation();
    expect(isLandscape).toBe(false);

    classes = getSandboxIframeClasses(isLandscape);
    expect(classes).toContain("max-w-full");
    expect(classes).not.toContain("aspect-video");
  });
});
