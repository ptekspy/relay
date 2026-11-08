import { describe, expect, it } from "bun:test";
import {
  type TouchStreamEvent,
  TouchVisualizer,
} from "../src/touch-visualizer.js";

describe("TASK-137: Touch Ripple & Pointer Visualization Overlay", () => {
  it("tracks active touches during start and move phases with low latency", () => {
    const visualizer = new TouchVisualizer();
    const eventTime = Date.now();

    const startEvt: TouchStreamEvent = {
      phase: "start",
      touches: [
        { id: 1, x: 150, y: 300 },
        { id: 2, x: 200, y: 350 },
      ],
      timestamp: eventTime,
    };

    const markers = visualizer.processTouchEvent(startEvt);
    expect(markers.length).toBe(2);
    expect(visualizer.getActiveTouches().length).toBe(2);

    for (const marker of markers) {
      expect(marker.latencyMs).toBeLessThan(30);
    }

    // Move touch 1
    const moveEvt: TouchStreamEvent = {
      phase: "move",
      touches: [{ id: 1, x: 160, y: 310 }],
      timestamp: Date.now(),
    };

    visualizer.processTouchEvent(moveEvt);
    const active = visualizer.getActiveTouches();
    const t1 = active.find((t) => t.id === 1);
    expect(t1?.x).toBe(160);
    expect(t1?.y).toBe(310);
  });

  it("transitions released touches to completed ripple list and generates valid ripple styles", () => {
    const visualizer = new TouchVisualizer();

    visualizer.processTouchEvent({
      phase: "start",
      touches: [{ id: 42, x: 100, y: 200 }],
      timestamp: Date.now(),
    });

    expect(visualizer.getActiveTouches().length).toBe(1);

    visualizer.processTouchEvent({
      phase: "end",
      touches: [{ id: 42, x: 100, y: 200 }],
      timestamp: Date.now(),
    });

    expect(visualizer.getActiveTouches().length).toBe(0);
    expect(visualizer.getCompletedRipples().length).toBe(1);
    expect(visualizer.getCompletedRipples()[0]?.id).toBe(42);

    const css = visualizer.generateRippleCss();
    expect(css).toContain("relayRippleExpand");
    expect(css).toContain("border-radius: 50%");

    const el = visualizer.renderRippleElement(100, 200);
    expect(el.className).toBe("relay-touch-ripple");
    expect(el.style.left).toBe("100px");
    expect(el.style.top).toBe("200px");
  });
});
