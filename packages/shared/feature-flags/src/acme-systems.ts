import type { FeatureFlagKey } from "./types";

export const ACME_SYSTEMS_CONFIG = {} as const;

export type AcmeSystemsFeatureFlagKey = FeatureFlagKey<
  typeof ACME_SYSTEMS_CONFIG
>;
