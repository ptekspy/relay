export type FeatureFlagRecord = Record<string, boolean>;

/**
 * Extracts union of valid flag keys from a feature flag configuration object.
 */
export type FeatureFlagKey<T extends Record<string, unknown>> = keyof T;

/**
 * Extracts the value type of a feature flag from a configuration object.
 */
export type FeatureFlagValue<
  T extends Record<string, unknown>,
  K extends FeatureFlagKey<T> = FeatureFlagKey<T>,
> = T[K];

/**
 * Parses a boolean flag value from an environment variable string, boolean, or fallback default.
 */
export function parseBooleanFlag(
  value: string | boolean | undefined,
  defaultValue = false,
): boolean {
  if (typeof value === "boolean") return value;
  if (value === undefined || value === "") return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "true" ||
    normalized === "1" ||
    normalized === "yes" ||
    normalized === "on"
  ) {
    return true;
  }
  if (
    normalized === "false" ||
    normalized === "0" ||
    normalized === "no" ||
    normalized === "off"
  ) {
    return false;
  }
  return defaultValue;
}

/**
 * Reads an environment variable feature flag dynamically (works on server runtime).
 */
export function readEnvFlag(
  prefix: string,
  key: string,
  defaultValue = false,
): boolean {
  if (typeof process === "undefined" || !process.env) {
    return defaultValue;
  }
  const publicEnvKey = `NEXT_PUBLIC_${prefix}_${key}`;
  const serverEnvKey = `${prefix}_${key}`;
  const rawValue = process.env[publicEnvKey] ?? process.env[serverEnvKey];
  return parseBooleanFlag(rawValue, defaultValue);
}

/**
 * Checks whether a specific feature flag is enabled in the given configuration.
 */
export function isFeatureFlagEnabled<T extends Record<string, boolean>>(
  config: T,
  key: FeatureFlagKey<T>,
): boolean {
  return Boolean(config[key]);
}

/**
 * Creates a scoped checker function for a specific feature flag configuration.
 */
export function createFeatureFlagChecker<T extends Record<string, boolean>>(
  config: T,
) {
  return (key: FeatureFlagKey<T>): boolean => Boolean(config[key]);
}
