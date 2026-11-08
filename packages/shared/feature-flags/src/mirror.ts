import type { FeatureFlagKey } from "./types";

export const MIRROR_CONFIG = {} as const;

export type MirrorFeatureFlagKey = FeatureFlagKey<typeof MIRROR_CONFIG>;
