import { describe, expect, it } from "bun:test";
import { AnnotationManager } from "../../../apps/relay/cloud-web/lib/annotation-canvas.js";

describe("Journey 15: Session Annotation & Screen Drawing Canvas Verification", () => {
  it("creates, serializes, restores, and renders visual drawing annotations over live sessions", () => {
    const manager = new AnnotationManager();

    // 1. Add annotations of different tools
    const arrow = manager.addItem({
      tool: "arrow",
      color: "#FF3366",
      lineWidth: 3,
      startX: 10,
      startY: 20,
      endX: 100,
      endY: 150,
    });

    const rect = manager.addItem({
      tool: "rect",
      color: "#00E5FF",
      lineWidth: 2,
      startX: 50,
      startY: 50,
      endX: 200,
      endY: 120,
    });

    const text = manager.addItem({
      tool: "text",
      color: "#FFFFFF",
      lineWidth: 1,
      startX: 55,
      startY: 65,
      endX: 55,
      endY: 65,
      text: "Bug: Header overlap on mobile viewport",
    });

    expect(manager.getItems().length).toBe(3);
    expect(arrow.id).toStartWith("ann_");
    expect(arrow.timestamp).toBeGreaterThan(0);

    // 2. Test JSON Serialization
    const serialized = manager.serialize();
    expect(serialized).toContain("Bug: Header overlap on mobile viewport");
    expect(serialized).toContain("#FF3366");

    // 3. Test Deserialization into fresh manager
    const restoredManager = new AnnotationManager();
    restoredManager.deserialize(serialized);
    expect(restoredManager.getItems().length).toBe(3);
    expect(restoredManager.getItems()[1].tool).toBe("rect");
    expect(restoredManager.getItems()[2].text).toBe(
      "Bug: Header overlap on mobile viewport",
    );

    // 4. Test Canvas 2D Rendering Mock
    const mockCalls: string[] = [];
    const mockCtx = {
      save: () => mockCalls.push("save"),
      restore: () => mockCalls.push("restore"),
      beginPath: () => mockCalls.push("beginPath"),
      moveTo: (x: number, y: number) => mockCalls.push(`moveTo(${x},${y})`),
      lineTo: (x: number, y: number) => mockCalls.push(`lineTo(${x},${y})`),
      stroke: () => mockCalls.push("stroke"),
      strokeRect: (x: number, y: number, w: number, h: number) =>
        mockCalls.push(`strokeRect(${x},${y},${w},${h})`),
      closePath: () => mockCalls.push("closePath"),
      fill: () => mockCalls.push("fill"),
      fillText: (str: string, x: number, y: number) =>
        mockCalls.push(`fillText(${str},${x},${y})`),
      ellipse: () => mockCalls.push("ellipse"),
      strokeStyle: "",
      fillStyle: "",
      lineWidth: 1,
      lineCap: "",
      lineJoin: "",
      font: "",
    } as unknown as CanvasRenderingContext2D;

    manager.renderToCanvas(mockCtx);
    expect(mockCalls).toContain("save");
    expect(mockCalls).toContain("restore");
    expect(mockCalls).toContain("strokeRect(50,50,150,70)");
    expect(mockCalls).toContain(
      "fillText(Bug: Header overlap on mobile viewport,55,65)",
    );

    // 5. Remove item and clear
    const removed = manager.removeItem(rect.id);
    expect(removed).toBe(true);
    expect(manager.getItems().length).toBe(2);

    manager.clear();
    expect(manager.getItems().length).toBe(0);
  });
});
