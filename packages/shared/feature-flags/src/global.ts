import {
  type FeatureFlagKey,
  type FeatureFlagValue,
  isFeatureFlagEnabled,
  parseBooleanFlag,
} from "./types";

export const GLOBAL_CONFIG = {
  get AUTH_ENABLED(): boolean {
    return parseBooleanFlag(
      process.env.NEXT_PUBLIC_GLOBAL_AUTH_ENABLED ??
        process.env.GLOBAL_AUTH_ENABLED,
      false,
    );
  },
} as const;

export type GlobalFeatureFlagConfig = typeof GLOBAL_CONFIG;
export type GlobalFeatureFlagKey = FeatureFlagKey<typeof GLOBAL_CONFIG>;
export type GlobalFeatureFlagValue<
  K extends GlobalFeatureFlagKey = GlobalFeatureFlagKey,
> = FeatureFlagValue<typeof GLOBAL_CONFIG, K>;

export function isGlobalFeatureFlagEnabled(key: GlobalFeatureFlagKey): boolean {
  return isFeatureFlagEnabled(GLOBAL_CONFIG, key);
}
