import type { FeatureFlagKey } from "./types";

export const PADDY_SYSTEMS_CONFIG = {} as const;

export type PaddySystemsFeatureFlagKey = FeatureFlagKey<
  typeof PADDY_SYSTEMS_CONFIG
>;
