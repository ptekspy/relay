import { describe, expect, it } from "vitest";
import { createHealthHandler } from "./index.js";

describe("api-core", () => {
  it("creates a health response", async () => {
    const handler = createHealthHandler({ name: "test-api", version: "0.0.0" });

    await expect(handler({} as never)).toEqual({
      status: "ok",
      service: "test-api",
      version: "0.0.0",
    });
  });
});
