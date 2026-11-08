import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getWearfolioFeatureFlag, WEARFOLIO_CONFIG } from "./wearfolio";

describe("WEARFOLIO_CONFIG", () => {
  const originalStage = process.env.WEARFOLIO_STAGE;
  const originalPublicStage = process.env.NEXT_PUBLIC_WEARFOLIO_STAGE;

  beforeEach(() => {
    delete process.env.WEARFOLIO_STAGE;
    delete process.env.NEXT_PUBLIC_WEARFOLIO_STAGE;
  });

  afterEach(() => {
    if (originalStage !== undefined) {
      process.env.WEARFOLIO_STAGE = originalStage;
    } else {
      delete process.env.WEARFOLIO_STAGE;
    }
    if (originalPublicStage !== undefined) {
      process.env.NEXT_PUBLIC_WEARFOLIO_STAGE = originalPublicStage;
    } else {
      delete process.env.NEXT_PUBLIC_WEARFOLIO_STAGE;
    }
  });

  it("defaults STAGE to EARLY_ACCESS when not set", () => {
    expect(WEARFOLIO_CONFIG.STAGE).toBe("EARLY_ACCESS");
    expect(getWearfolioFeatureFlag("STAGE")).toBe("EARLY_ACCESS");
  });

  it("reads STAGE from NEXT_PUBLIC_WEARFOLIO_STAGE", () => {
    process.env.NEXT_PUBLIC_WEARFOLIO_STAGE = "BETA";
    expect(WEARFOLIO_CONFIG.STAGE).toBe("BETA");
  });

  it("reads STAGE from WEARFOLIO_STAGE", () => {
    process.env.WEARFOLIO_STAGE = "GA";
    expect(WEARFOLIO_CONFIG.STAGE).toBe("GA");
  });
});
