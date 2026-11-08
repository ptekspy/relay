import { describe, expect, it } from "bun:test";
import { AnnotationManager } from "../lib/annotation-canvas";

describe("TASK-177: Session Annotation & Drawing Canvas Tool", () => {
  it("adds, retrieves, and removes annotations", () => {
    const manager = new AnnotationManager();

    const arrow = manager.addItem({
      tool: "arrow",
      color: "#FF3366",
      lineWidth: 3,
      startX: 10,
      startY: 20,
      endX: 100,
      endY: 150,
    });

    const circle = manager.addItem({
      tool: "circle",
      color: "#00E5FF",
      lineWidth: 2,
      startX: 50,
      startY: 50,
      endX: 90,
      endY: 90,
    });

    expect(manager.getItems().length).toBe(2);
    expect(arrow.tool).toBe("arrow");
    expect(arrow.id.startsWith("ann_")).toBe(true);

    const removed = manager.removeItem(arrow.id);
    expect(removed).toBe(true);
    expect(manager.getItems().length).toBe(1);
    expect(manager.getItems()[0]?.id).toBe(circle.id);
  });

  it("serializes and restores annotations across sessions", () => {
    const manager1 = new AnnotationManager();
    manager1.addItem({
      tool: "rect",
      color: "#FFE600",
      lineWidth: 4,
      startX: 0,
      startY: 0,
      endX: 200,
      endY: 100,
    });

    const json = manager1.serialize();
    expect(json).toContain("rect");
    expect(json).toContain("#FFE600");

    const manager2 = new AnnotationManager();
    manager2.deserialize(json);
    expect(manager2.getItems().length).toBe(1);
    expect(manager2.getItems()[0]?.tool).toBe("rect");
    expect(manager2.getItems()[0]?.lineWidth).toBe(4);
  });

  it("renders shapes to CanvasRenderingContext2D mock without error", () => {
    const manager = new AnnotationManager();
    manager.addItem({
      tool: "line",
      color: "#FF3366",
      lineWidth: 2,
      startX: 10,
      startY: 10,
      endX: 20,
      endY: 20,
    });
    manager.addItem({
      tool: "arrow",
      color: "#00FF66",
      lineWidth: 3,
      startX: 30,
      startY: 30,
      endX: 60,
      endY: 60,
    });

    const calls: string[] = [];
    const mockCtx = {
      save: () => calls.push("save"),
      restore: () => calls.push("restore"),
      beginPath: () => calls.push("beginPath"),
      moveTo: () => calls.push("moveTo"),
      lineTo: () => calls.push("lineTo"),
      stroke: () => calls.push("stroke"),
      fill: () => calls.push("fill"),
      closePath: () => calls.push("closePath"),
      strokeRect: () => calls.push("strokeRect"),
      ellipse: () => calls.push("ellipse"),
      fillText: () => calls.push("fillText"),
    } as unknown as CanvasRenderingContext2D;

    manager.renderToCanvas(mockCtx);
    expect(calls).toContain("beginPath");
    expect(calls).toContain("stroke");
    expect(calls).toContain("fill");
  });
});
