import type { FeatureFlagKey } from "./types";

export const RELAY_CONFIG = {} as const;

export type RelayFeatureFlagKey = FeatureFlagKey<typeof RELAY_CONFIG>;
