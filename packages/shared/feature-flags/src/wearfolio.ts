import type { FeatureFlagKey, FeatureFlagValue } from "./types";

export type WearfolioStage = "EARLY_ACCESS" | "BETA" | "GA";

export const WEARFOLIO_CONFIG = {
  get STAGE(): WearfolioStage | string {
    const raw =
      process.env.NEXT_PUBLIC_WEARFOLIO_STAGE ?? process.env.WEARFOLIO_STAGE;
    if (raw) {
      return raw;
    }
    return "EARLY_ACCESS";
  },
} as const;

export type WearfolioFeatureFlagConfig = typeof WEARFOLIO_CONFIG;
export type WearfolioFeatureFlagKey = FeatureFlagKey<typeof WEARFOLIO_CONFIG>;
export type WearfolioFeatureFlagValue<
  K extends WearfolioFeatureFlagKey = WearfolioFeatureFlagKey,
> = FeatureFlagValue<typeof WEARFOLIO_CONFIG, K>;

export function getWearfolioFeatureFlag<K extends WearfolioFeatureFlagKey>(
  key: K,
): WearfolioFeatureFlagValue<K> {
  return WEARFOLIO_CONFIG[key];
}
