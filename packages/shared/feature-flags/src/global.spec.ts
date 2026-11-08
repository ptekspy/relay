import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
} from "vitest";
import {
  GLOBAL_CONFIG,
  type GlobalFeatureFlagConfig,
  type GlobalFeatureFlagKey,
  type GlobalFeatureFlagValue,
  isGlobalFeatureFlagEnabled,
} from "./global";
import {
  createFeatureFlagChecker,
  type FeatureFlagKey,
  type FeatureFlagValue,
  isFeatureFlagEnabled,
  parseBooleanFlag,
  readEnvFlag,
} from "./types";

describe("GLOBAL_CONFIG", () => {
  const originalGlobal = process.env.GLOBAL_AUTH_ENABLED;
  const originalPublicGlobal = process.env.NEXT_PUBLIC_GLOBAL_AUTH_ENABLED;

  beforeEach(() => {
    delete process.env.GLOBAL_AUTH_ENABLED;
    delete process.env.NEXT_PUBLIC_GLOBAL_AUTH_ENABLED;
  });

  afterEach(() => {
    if (originalGlobal !== undefined) {
      process.env.GLOBAL_AUTH_ENABLED = originalGlobal;
    } else {
      delete process.env.GLOBAL_AUTH_ENABLED;
    }
    if (originalPublicGlobal !== undefined) {
      process.env.NEXT_PUBLIC_GLOBAL_AUTH_ENABLED = originalPublicGlobal;
    } else {
      delete process.env.NEXT_PUBLIC_GLOBAL_AUTH_ENABLED;
    }
  });

  it("defines AUTH_ENABLED as false by default when no env var is present", () => {
    expect(GLOBAL_CONFIG.AUTH_ENABLED).toBe(false);
    expect(isGlobalFeatureFlagEnabled("AUTH_ENABLED")).toBe(false);
  });

  it("overrides AUTH_ENABLED when GLOBAL_AUTH_ENABLED is set to true", () => {
    process.env.GLOBAL_AUTH_ENABLED = "true";
    expect(GLOBAL_CONFIG.AUTH_ENABLED).toBe(true);
    expect(isGlobalFeatureFlagEnabled("AUTH_ENABLED")).toBe(true);
  });

  it("overrides AUTH_ENABLED when NEXT_PUBLIC_GLOBAL_AUTH_ENABLED is set to true", () => {
    process.env.NEXT_PUBLIC_GLOBAL_AUTH_ENABLED = "true";
    expect(GLOBAL_CONFIG.AUTH_ENABLED).toBe(true);
    expect(isGlobalFeatureFlagEnabled("AUTH_ENABLED")).toBe(true);
  });

  it("respects false overrides", () => {
    process.env.GLOBAL_AUTH_ENABLED = "false";
    expect(GLOBAL_CONFIG.AUTH_ENABLED).toBe(false);

    process.env.GLOBAL_AUTH_ENABLED = "1";
    expect(GLOBAL_CONFIG.AUTH_ENABLED).toBe(true);

    process.env.GLOBAL_AUTH_ENABLED = "0";
    expect(GLOBAL_CONFIG.AUTH_ENABLED).toBe(false);
  });

  it("has proper type support for keys and values using generic types", () => {
    expectTypeOf<GlobalFeatureFlagKey>().toEqualTypeOf<"AUTH_ENABLED">();
    expectTypeOf<
      FeatureFlagKey<typeof GLOBAL_CONFIG>
    >().toEqualTypeOf<"AUTH_ENABLED">();
    expectTypeOf<
      GlobalFeatureFlagValue<"AUTH_ENABLED">
    >().toEqualTypeOf<boolean>();
    expectTypeOf<
      FeatureFlagValue<typeof GLOBAL_CONFIG, "AUTH_ENABLED">
    >().toEqualTypeOf<boolean>();
    expectTypeOf<GlobalFeatureFlagConfig>().toMatchTypeOf<{
      readonly AUTH_ENABLED: boolean;
    }>();
  });
});

describe("Generic Feature Flag Helpers", () => {
  const CUSTOM_CONFIG = {
    BETA_DASHBOARD: true,
    EXPERIMENTAL_AI: false,
  } as const;

  it("checks flags with isFeatureFlagEnabled", () => {
    expect(isFeatureFlagEnabled(CUSTOM_CONFIG, "BETA_DASHBOARD")).toBe(true);
    expect(isFeatureFlagEnabled(CUSTOM_CONFIG, "EXPERIMENTAL_AI")).toBe(false);
  });

  it("creates scoped checker with createFeatureFlagChecker", () => {
    const checkFlag = createFeatureFlagChecker(CUSTOM_CONFIG);
    expect(checkFlag("BETA_DASHBOARD")).toBe(true);
    expect(checkFlag("EXPERIMENTAL_AI")).toBe(false);
  });

  it("parses boolean flags correctly", () => {
    expect(parseBooleanFlag("true")).toBe(true);
    expect(parseBooleanFlag("TRUE")).toBe(true);
    expect(parseBooleanFlag("1")).toBe(true);
    expect(parseBooleanFlag("yes")).toBe(true);
    expect(parseBooleanFlag("on")).toBe(true);

    expect(parseBooleanFlag("false")).toBe(false);
    expect(parseBooleanFlag("FALSE")).toBe(false);
    expect(parseBooleanFlag("0")).toBe(false);
    expect(parseBooleanFlag("no")).toBe(false);
    expect(parseBooleanFlag("off")).toBe(false);

    expect(parseBooleanFlag(undefined, true)).toBe(true);
    expect(parseBooleanFlag(undefined, false)).toBe(false);
    expect(parseBooleanFlag("", true)).toBe(true);
  });

  it("reads dynamic env flags with readEnvFlag", () => {
    process.env.RELAY_TEST_FLAG = "true";
    expect(readEnvFlag("RELAY", "TEST_FLAG")).toBe(true);
    delete process.env.RELAY_TEST_FLAG;

    process.env.NEXT_PUBLIC_RELAY_TEST_FLAG = "true";
    expect(readEnvFlag("RELAY", "TEST_FLAG")).toBe(true);
    delete process.env.NEXT_PUBLIC_RELAY_TEST_FLAG;
  });
});
