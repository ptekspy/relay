import { toTitleCase } from "@paddy-systems/utils/toTitleCase";

export function createDocLabel(section: string): string {
  return `Docs / ${toTitleCase(section)}`;
}
