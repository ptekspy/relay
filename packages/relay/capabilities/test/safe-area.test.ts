import { describe, expect, it } from "bun:test";
import {
  DEVICE_SAFE_AREA_PRESETS,
  SafeAreaVisualizer,
} from "../src/safe-area.js";

describe("TASK-138: Device Safe Area Inset & Notch Emulation Visualizer", () => {
  it("generates CSS variable insets corresponding to iPhone 16 Pro", () => {
    const visualizer = new SafeAreaVisualizer();
    visualizer.setProfile("iphone-16-pro");

    const cssVars = visualizer.generateCssVariables();
    expect(cssVars["--relay-safe-area-top"]).toBe("59px");
    expect(cssVars["--relay-safe-area-bottom"]).toBe("34px");
    expect(cssVars["--relay-safe-area-left"]).toBe("0px");
    expect(cssVars["--relay-safe-area-right"]).toBe("0px");

    const cutoutHtml = visualizer.renderCutoutHtml();
    expect(cutoutHtml).toContain("relay-cutout-dynamic-island");
    expect(cutoutHtml).toContain("width: 125px");

    const indicatorHtml = visualizer.renderHomeIndicatorHtml();
    expect(indicatorHtml).toContain("relay-home-indicator");
  });

  it("switches to Android punch-hole and generic fullscreen profiles", () => {
    const visualizer = new SafeAreaVisualizer();

    visualizer.setProfile("pixel-8");
    expect(visualizer.getProfile().deviceName).toBe("Google Pixel 8");
    expect(visualizer.renderCutoutHtml()).toContain("relay-cutout-punch-hole");

    visualizer.setProfile("standard");
    expect(visualizer.renderCutoutHtml()).toBe(""); // No cutout
    expect(visualizer.renderHomeIndicatorHtml()).toBe(""); // No home indicator
  });

  it("hides overlays when visibility is toggled off", () => {
    const visualizer = new SafeAreaVisualizer();
    expect(visualizer.isVisible()).toBe(true);

    visualizer.setVisible(false);
    expect(visualizer.renderCutoutHtml()).toBe("");
    expect(visualizer.renderHomeIndicatorHtml()).toBe("");
  });
});
