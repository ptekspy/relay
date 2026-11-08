/**
 * Remote DOM Tree Explorer with Live Highlight Overlay
 *
 * Serializes the DOM hierarchy into compact JSON nodes, monitors live DOM changes
 * via batched MutationObserver events, and generates highlight overlay geometry
 * when inspecting elements remotely.
 *
 * Note for Octavia: Used by the Elements inspector panel in Cloud Web.
 */

export interface SerializedDomNode {
  id: number;
  nodeType: number; // 1: Element, 3: Text, 8: Comment
  nodeName: string;
  attributes?: Record<string, string>;
  textContent?: string;
  children?: SerializedDomNode[];
  parentId?: number;
}

export interface DomMutationBatch {
  addedNodes: SerializedDomNode[];
  removedNodeIds: number[];
  attributeChanges: Array<{
    targetId: number;
    name: string;
    value: string | null;
  }>;
  characterDataChanges: Array<{ targetId: number; text: string }>;
  timestamp: number;
}

export interface NodeHighlightGeometry {
  top: number;
  left: number;
  width: number;
  height: number;
  tagInfo: string;
  cssStyle: Record<string, string>;
}

export class DomTreeManager {
  private nextNodeId = 1;
  private readonly nodeMap = new WeakMap<Node, number>();
  private readonly idToNodeMap = new Map<number, Node>();
  private observer: MutationObserver | null = null;

  public getNodeId(node: Node): number {
    let id = this.nodeMap.get(node);
    if (!id) {
      id = this.nextNodeId++;
      this.nodeMap.set(node, id);
      this.idToNodeMap.set(id, node);
    }
    return id;
  }

  public getNodeById(id: number): Node | undefined {
    return this.idToNodeMap.get(id);
  }

  public serializeNode(
    node: Node,
    maxDepth = 15,
    currentDepth = 0,
  ): SerializedDomNode {
    const id = this.getNodeId(node);
    const nodeType = node.nodeType;
    const nodeName = node.nodeName.toLowerCase();

    const serialized: SerializedDomNode = {
      id,
      nodeType,
      nodeName,
    };

    if (nodeType === 3 /* TEXT_NODE */) {
      serialized.textContent = node.textContent?.slice(0, 200) ?? "";
      return serialized;
    }

    if (nodeType === 1 /* ELEMENT_NODE */ && "getAttributeNames" in node) {
      const el = node as Element;
      const attrNames = el.getAttributeNames();
      if (attrNames.length > 0) {
        const attributes: Record<string, string> = {};
        for (const name of attrNames) {
          attributes[name] = el.getAttribute(name) ?? "";
        }
        serialized.attributes = attributes;
      }
    }

    if (
      currentDepth < maxDepth &&
      node.childNodes &&
      node.childNodes.length > 0
    ) {
      const children: SerializedDomNode[] = [];
      for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];
        if (child) {
          // Ignore empty whitespace-only text nodes to keep tree lean
          if (child.nodeType === 3 && !child.textContent?.trim()) {
            continue;
          }
          const serializedChild = this.serializeNode(
            child,
            maxDepth,
            currentDepth + 1,
          );
          serializedChild.parentId = id;
          children.push(serializedChild);
        }
      }
      if (children.length > 0) {
        serialized.children = children;
      }
    }

    return serialized;
  }

  public createHighlightGeometry(node: Node): NodeHighlightGeometry | null {
    if (!node || node.nodeType !== 1 || !("getBoundingClientRect" in node)) {
      return null;
    }

    const el = node as Element;
    const rect = el.getBoundingClientRect();
    const className =
      typeof el.className === "string" && el.className
        ? `.${el.className.trim().split(/\s+/).join(".")}`
        : "";
    const idAttr = el.id ? `#${el.id}` : "";
    const tagInfo = `${el.nodeName.toLowerCase()}${idAttr}${className} ${Math.round(rect.width)}×${Math.round(rect.height)}`;

    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      tagInfo,
      cssStyle: {
        position: "fixed",
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        backgroundColor: "rgba(59, 130, 246, 0.25)",
        outline: "1px solid rgba(59, 130, 246, 0.8)",
        pointerEvents: "none",
        zIndex: "999999",
      },
    };
  }

  public observe(
    rootNode: Node,
    onBatch: (batch: DomMutationBatch) => void,
  ): void {
    if (typeof MutationObserver === "undefined") {
      return;
    }

    this.observer = new MutationObserver((mutations) => {
      const addedNodes: SerializedDomNode[] = [];
      const removedNodeIds: number[] = [];
      const attributeChanges: Array<{
        targetId: number;
        name: string;
        value: string | null;
      }> = [];
      const characterDataChanges: Array<{ targetId: number; text: string }> =
        [];

      for (const m of mutations) {
        const targetId = this.getNodeId(m.target);

        if (m.type === "childList") {
          for (let i = 0; i < m.addedNodes.length; i++) {
            const added = m.addedNodes[i];
            if (added) {
              const s = this.serializeNode(added);
              s.parentId = targetId;
              addedNodes.push(s);
            }
          }
          for (let i = 0; i < m.removedNodes.length; i++) {
            const removed = m.removedNodes[i];
            if (removed) {
              const removedId = this.nodeMap.get(removed);
              if (removedId) {
                removedNodeIds.push(removedId);
                this.idToNodeMap.delete(removedId);
              }
            }
          }
        } else if (m.type === "attributes" && m.attributeName) {
          const el = m.target as Element;
          attributeChanges.push({
            targetId,
            name: m.attributeName,
            value: el.getAttribute(m.attributeName),
          });
        } else if (m.type === "characterData") {
          characterDataChanges.push({
            targetId,
            text: m.target.textContent ?? "",
          });
        }
      }

      onBatch({
        addedNodes,
        removedNodeIds,
        attributeChanges,
        characterDataChanges,
        timestamp: Date.now(),
      });
    });

    this.observer.observe(rootNode, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
  }

  public disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.idToNodeMap.clear();
  }
}
