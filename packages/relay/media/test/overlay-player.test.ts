import { describe, expect, it } from "bun:test";
import {
  type DomElementRect,
  SynchronizedOverlayPlayer,
} from "../src/overlay-player.js";

describe("TASK-157: Synchronized Pixel-to-DOM Video Overlay Player", () => {
  it("resolves click coordinates to the targeted DOM element and selector", () => {
    const rects: DomElementRect[] = [
      {
        id: "node-header",
        selector: "header.site-header",
        x: 0,
        y: 0,
        width: 1920,
        height: 80,
      },
      {
        id: "node-login-btn",
        selector: "button#login-btn",
        x: 1800,
        y: 20,
        width: 100,
        height: 40,
      },
    ];

    const player = new SynchronizedOverlayPlayer(rects);

    // Click inside login button
    const btnClick = player.resolveClick(1920, 1080, 1850, 40);
    expect(btnClick.targetId).toBe("node-login-btn");
    expect(btnClick.targetSelector).toBe("button#login-btn");
    expect(btnClick.matchedRect?.width).toBe(100);
    expect(btnClick.normalizedX).toBeCloseTo(1850 / 1920, 3);
    expect(btnClick.normalizedY).toBeCloseTo(40 / 1080, 3);

    // Click outside login button but inside header
    const headerClick = player.resolveClick(1920, 1080, 500, 30);
    expect(headerClick.targetId).toBe("node-header");
    expect(headerClick.targetSelector).toBe("header.site-header");

    // Click in blank body
    const blankClick = player.resolveClick(1920, 1080, 500, 500);
    expect(blankClick.targetId).toBeNull();
    expect(blankClick.matchedRect).toBeNull();
  });

  it("retrieves highlight bounding box by element ID", () => {
    const rects: DomElementRect[] = [
      {
        id: "node-card-1",
        selector: ".card-item",
        x: 50,
        y: 100,
        width: 300,
        height: 200,
      },
    ];

    const player = new SynchronizedOverlayPlayer(rects);
    const box = player.getHighlightBox("node-card-1");
    expect(box).not.toBeNull();
    expect(box?.x).toBe(50);
    expect(box?.y).toBe(100);

    expect(player.getHighlightBox("non-existent")).toBeNull();
  });
});
