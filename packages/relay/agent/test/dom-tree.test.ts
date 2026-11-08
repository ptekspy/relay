import { describe, expect, it } from "bun:test";
import { DomTreeManager } from "../src/dom-tree.js";

describe("TASK-141: Remote DOM Tree Explorer with Live Highlight Overlay", () => {
  const createMockElement = (
    name: string,
    attrs: Record<string, string> = {},
    children: Node[] = [],
  ): Element => {
    const el = {
      nodeType: 1,
      nodeName: name.toUpperCase(),
      className: attrs.class || "",
      id: attrs.id || "",
      getAttributeNames: () => Object.keys(attrs),
      getAttribute: (k: string) => attrs[k] ?? null,
      childNodes: children,
      getBoundingClientRect: () => ({
        top: 50,
        left: 20,
        width: 320,
        height: 180,
      }),
    };
    return el as unknown as Element;
  };

  it("serializes element node hierarchy with attributes and children", () => {
    const manager = new DomTreeManager();

    const childText: Node = {
      nodeType: 3,
      nodeName: "#text",
      textContent: "Click me",
      childNodes: [],
    } as unknown as Node;

    const button = createMockElement(
      "button",
      { class: "btn-primary", id: "submit-btn" },
      [childText],
    );
    const container = createMockElement("div", { class: "modal-dialog" }, [
      button as unknown as Node,
    ]);

    const serialized = manager.serializeNode(container as unknown as Node);

    expect(serialized.nodeName).toBe("div");
    expect(serialized.attributes?.class).toBe("modal-dialog");
    expect(serialized.children?.length).toBe(1);

    const serializedButton = serialized.children?.[0];
    expect(serializedButton?.nodeName).toBe("button");
    expect(serializedButton?.attributes?.id).toBe("submit-btn");
    expect(serializedButton?.children?.length).toBe(1);
    expect(serializedButton?.children?.[0]?.textContent).toBe("Click me");
  });

  it("creates highlight geometry and CSS styling matching bounding box", () => {
    const manager = new DomTreeManager();
    const button = createMockElement("button", {
      class: "btn-primary",
      id: "submit-btn",
    });

    const highlight = manager.createHighlightGeometry(
      button as unknown as Node,
    );

    expect(highlight).not.toBeNull();
    expect(highlight?.top).toBe(50);
    expect(highlight?.left).toBe(20);
    expect(highlight?.width).toBe(320);
    expect(highlight?.height).toBe(180);
    expect(highlight?.tagInfo).toBe("button#submit-btn.btn-primary 320×180");
    expect(highlight?.cssStyle.position).toBe("fixed");
    expect(highlight?.cssStyle.outline).toContain("solid");
  });

  it("retrieves tracked node references by assigned node ID", () => {
    const manager = new DomTreeManager();
    const div = createMockElement("div");

    const id = manager.getNodeId(div as unknown as Node);
    expect(id).toBeGreaterThan(0);

    const retrieved = manager.getNodeById(id);
    expect(retrieved).toBe(div as unknown as Node);

    manager.disconnect();
    expect(manager.getNodeById(id)).toBeUndefined();
  });
});
