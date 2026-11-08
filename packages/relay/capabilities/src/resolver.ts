import type { RelayCapabilitySet } from "./schema.js";

export function resolveNegotiatedCapabilities(
  hostCapabilities: RelayCapabilitySet,
  receiverCapabilities: RelayCapabilitySet,
): RelayCapabilitySet {
  const result: Partial<RelayCapabilitySet> = {};

  for (const key of Object.keys(hostCapabilities) as Array<
    keyof RelayCapabilitySet
  >) {
    // Both host and receiver must support the capability to be active
    result[key] = hostCapabilities[key] && receiverCapabilities[key];
  }

  return result as RelayCapabilitySet;
}
