import { describe, expect, it } from "vitest";

import { cn } from "./cn.js";

describe("cn", () => {
  it("merges class names correctly", () => {
    expect(cn("base", "extra")).toBe("base extra");
  });

  it("handles conditional classes and falsy values", () => {
    expect(
      cn("base", false && "hidden", null, undefined, 0 && "zero", "visible"),
    ).toBe("base visible");
  });

  it("resolves conflicting Tailwind class names using twMerge", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles arrays and object conditions", () => {
    expect(cn(["btn", { "btn-active": true, "btn-disabled": false }])).toBe(
      "btn btn-active",
    );
  });
});
