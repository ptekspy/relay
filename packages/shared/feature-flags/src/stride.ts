import type { FeatureFlagKey } from "./types";

export const STRIDE_CONFIG = {} as const;

export type StrideFeatureFlagKey = FeatureFlagKey<typeof STRIDE_CONFIG>;
