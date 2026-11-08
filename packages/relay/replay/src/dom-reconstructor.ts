import type { DomMutationEvent } from "@paddy-systems/relay-protocol";
import type { ReplayDomNode } from "./types.js";

/**
 * Headless virtual DOM snapshot and patch reconstructor.
 */
export class DomReconstructor {
  private root: ReplayDomNode = {
    id: "root",
    tagName: "BODY",
    attributes: {},
    children: [],
  };

  constructor(initialRoot?: ReplayDomNode) {
    if (initialRoot) {
      this.root = JSON.parse(JSON.stringify(initialRoot));
    }
  }

  public getRoot(): ReplayDomNode {
    return JSON.parse(JSON.stringify(this.root));
  }

  public applyMutation(mutation: DomMutationEvent): void {
    // Locate node by selector or fallback to root
    const target =
      this.findNodeBySelector(this.root, mutation.targetSelector) || this.root;

    if (mutation.removedNodesCount > 0 && target.children.length > 0) {
      target.children.splice(
        0,
        Math.min(mutation.removedNodesCount, target.children.length),
      );
    }

    for (let i = 0; i < mutation.addedNodesCount; i++) {
      target.children.push({
        id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tagName: "DIV",
        attributes: { class: "relay-injected-element" },
        children: [],
        textContent: `Element added via mutation on ${mutation.targetSelector}`,
      });
    }
  }

  public applyMutations(mutations: DomMutationEvent[]): void {
    for (const m of mutations) {
      this.applyMutation(m);
    }
  }

  private findNodeBySelector(
    node: ReplayDomNode,
    selector: string,
  ): ReplayDomNode | null {
    if (selector.toUpperCase() === node.tagName || selector === `#${node.id}`) {
      return node;
    }
    for (const child of node.children) {
      const match = this.findNodeBySelector(child, selector);
      if (match) return match;
    }
    return null;
  }
}
