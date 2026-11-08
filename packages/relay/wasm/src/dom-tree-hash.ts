export interface MinimalDomNode {
  tag: string;
  id?: string;
  classes?: string[];
  attributes?: Record<string, string>;
  children?: MinimalDomNode[];
}

export class WasmDomTreeHasher {
  public computeTreeHash(node: MinimalDomNode): number {
    let hash = 0x811c9dc5;

    const feedString = (str: string) => {
      for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193) >>> 0;
      }
    };

    feedString(node.tag);
    if (node.id) feedString(`#${node.id}`);
    if (node.classes) feedString(`.${node.classes.sort().join(".")}`);

    if (node.attributes) {
      const sortedKeys = Object.keys(node.attributes).sort();
      for (const k of sortedKeys) {
        feedString(`${k}=${node.attributes[k]}`);
      }
    }

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        const childHash = this.computeTreeHash(child);
        hash ^= childHash;
        hash = Math.imul(hash, 0x01000193) >>> 0;
      }
    }

    return hash >>> 0;
  }

  public areSubtreesIdentical(a: MinimalDomNode, b: MinimalDomNode): boolean {
    return this.computeTreeHash(a) === this.computeTreeHash(b);
  }
}

export const wasmDomTreeHasher = new WasmDomTreeHasher();
