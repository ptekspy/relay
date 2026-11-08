import { describe, expect, it } from "bun:test";
import {
  type InspectableElement,
  StyleInspectorManager,
} from "../src/style-inspector.js";

describe("TASK-142: Computed CSS Style Inspector & Box Model Visualizer", () => {
  const createMockElementWithStyles = (): {
    el: InspectableElement;
    appliedProps: Record<string, string>;
  } => {
    const appliedProps: Record<string, string> = {
      color: "red",
      "font-size": "16px",
    };

    const el: InspectableElement = {
      nodeType: 1,
      nodeName: "DIV",
      style: {
        get length() {
          return Object.keys(appliedProps).length;
        },
        getPropertyValue: (prop: string) => appliedProps[prop] || "",
        setProperty: (prop: string, val: string) => {
          appliedProps[prop] = val;
        },
        removeProperty: (prop: string) => {
          const prev = appliedProps[prop] || "";
          delete appliedProps[prop];
          return prev;
        },
      },
      getBoundingClientRect: () => ({ width: 300, height: 150 }),
    };

    return { el, appliedProps };
  };

  it("extracts computed box model metrics accurately from computed style values", () => {
    const manager = new StyleInspectorManager();
    const { el } = createMockElementWithStyles();

    const mockComputed: Record<string, string> = {
      width: "300px",
      height: "150px",
      "margin-top": "16px",
      "margin-right": "8px",
      "margin-bottom": "16px",
      "margin-left": "8px",
      "border-top-width": "2px",
      "border-right-width": "2px",
      "border-bottom-width": "2px",
      "border-left-width": "2px",
      "padding-top": "12px",
      "padding-right": "24px",
      "padding-bottom": "12px",
      "padding-left": "24px",
    };

    const snapshot = manager.inspectElement(el, () => mockComputed);

    expect(snapshot.boxModel.width).toBe(300);
    expect(snapshot.boxModel.height).toBe(150);
    expect(snapshot.boxModel.margin.top).toBe(16);
    expect(snapshot.boxModel.margin.right).toBe(8);
    expect(snapshot.boxModel.border.top).toBe(2);
    expect(snapshot.boxModel.padding.left).toBe(24);
  });

  it("updates and removes inline styles on the targeted element", () => {
    const manager = new StyleInspectorManager();
    const { el, appliedProps } = createMockElementWithStyles();

    // Update style
    const updated = manager.updateElementStyle(el, "background-color", "blue");
    expect(updated).toBe(true);
    expect(appliedProps["background-color"]).toBe("blue");

    // Remove style
    const removed = manager.removeElementStyle(el, "color");
    expect(removed).toBe(true);
    expect(appliedProps.color).toBeUndefined();
  });
});
