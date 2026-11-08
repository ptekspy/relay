import type { NitroConfig } from "nitropack/types";

export const nitroConfig: NitroConfig = {
  compatibilityDate: "2026-09-12",
};

export const baseNitroConfig = nitroConfig;

export function defineNitroConfig(overrides: NitroConfig = {}): NitroConfig {
  return {
    ...nitroConfig,
    ...overrides,
  };
}

export const createNitroConfig = defineNitroConfig;

export type { NitroConfig };
export default nitroConfig;
