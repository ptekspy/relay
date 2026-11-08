import { describe, expect, it } from "vitest";

import { toTitleCase } from "./toTitleCase.js";

describe("toTitleCase", () => {
  it("normalises whitespace and capitalises each word", () => {
    expect(toTitleCase("  local NETWORKING docs ")).toBe(
      "Local Networking Docs",
    );
  });

  it("returns an empty string for whitespace-only input", () => {
    expect(toTitleCase("   ")).toBe("");
  });
});
