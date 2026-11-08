import { describe, expect, it } from "vitest";

import { createDocLabel } from "./createDocLabel.js";

describe("createDocLabel", () => {
  it("formats a documentation section label with the shared text utility", () => {
    expect(createDocLabel("local networking")).toBe("Docs / Local Networking");
  });
});
