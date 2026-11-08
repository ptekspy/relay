import type { DomMutationPayload } from "./types.js";

export class SyntheticDomGenerator {
  public generateMutation(sequenceNumber: number): DomMutationPayload {
    const types: Array<DomMutationPayload["type"]> = [
      "attributes",
      "childList",
      "characterData",
    ];
    const type = types[sequenceNumber % types.length]!;

    return {
      type,
      targetSelector: `#app > div.feed > article:nth-child(${(sequenceNumber % 20) + 1})`,
      attributeName: type === "attributes" ? "data-active" : undefined,
      oldValue: type === "attributes" ? "false" : undefined,
      newValue: type === "attributes" ? "true" : undefined,
      addedNodesCount: type === "childList" ? 1 : 0,
      removedNodesCount: 0,
      textContent:
        type === "characterData"
          ? `Updated dynamic content string #${sequenceNumber}`
          : undefined,
    };
  }

  public generateBatch(count: number, startSeq = 1): DomMutationPayload[] {
    return Array.from({ length: count }, (_, i) =>
      this.generateMutation(startSeq + i),
    );
  }
}

export const syntheticDomGenerator = new SyntheticDomGenerator();
