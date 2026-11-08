import { describe, expect, it } from "vitest";
import {
  baseNitroConfig,
  createNitroConfig,
  default as defaultNitroConfig,
  defineNitroConfig,
  nitroConfig,
} from "./index.js";

describe("nitro-config", () => {
  it("exports the default nitro configuration with compatibilityDate", () => {
    expect(nitroConfig).toEqual({
      compatibilityDate: "2026-09-12",
    });
    expect(baseNitroConfig).toEqual(nitroConfig);
    expect(defaultNitroConfig).toEqual(nitroConfig);
  });

  it("allows creating a merged nitro configuration using defineNitroConfig", () => {
    const config = defineNitroConfig({
      preset: "node-server",
    });

    expect(config).toEqual({
      compatibilityDate: "2026-09-12",
      preset: "node-server",
    });
  });

  it("allows creating a merged nitro configuration using createNitroConfig", () => {
    const config = createNitroConfig({
      compatibilityDate: "2026-10-01",
    });

    expect(config).toEqual({
      compatibilityDate: "2026-10-01",
    });
  });
});
