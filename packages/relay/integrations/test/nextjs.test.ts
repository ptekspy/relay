import { describe, expect, it } from "bun:test";
import { NextJsServerActionsNormalizer } from "../src/nextjs.js";

describe("TASK-123: Next.js App Router Server Actions Proxy Normalizer", () => {
  it("detects server action requests accurately", () => {
    expect(
      NextJsServerActionsNormalizer.isServerActionRequest({
        "next-action": "abc1234567890",
        "content-type":
          "multipart/form-data; boundary=----WebKitFormBoundaryXYZ",
      }),
    ).toBe(true);

    expect(
      NextJsServerActionsNormalizer.isServerActionRequest({
        "content-type": "application/json",
      }),
    ).toBe(false);
  });

  it("normalizes request headers to bypass Next.js CSRF host/origin rejection while preserving action IDs", () => {
    const rawIncomingHeaders = {
      Host: "session-xyz.relay.paddy.systems",
      Origin: "https://session-xyz.relay.paddy.systems",
      Referer: "https://session-xyz.relay.paddy.systems/settings/profile",
      "Next-Action": "7a941f6e2b",
      "Next-Router-State-Tree": "%5B%22%22%2C%7B%22children%22%3A%5B%5D%7D%5D",
      "Content-Type": "multipart/form-data; boundary=----WebKitFormBoundaryXYZ",
    };

    const normalized = NextJsServerActionsNormalizer.normalizeRequestHeaders(
      rawIncomingHeaders,
      {
        localDevHost: "localhost:3000",
        localDevOrigin: "http://localhost:3000",
      },
    );

    expect(normalized.host).toBe("localhost:3000");
    expect(normalized.origin).toBe("http://localhost:3000");
    expect(normalized.referer).toBe("http://localhost:3000/settings/profile");
    expect(normalized["x-forwarded-host"]).toBe(
      "session-xyz.relay.paddy.systems",
    );
    expect(normalized["next-action"]).toBe("7a941f6e2b");
    expect(normalized["content-type"]).toContain(
      "multipart/form-data; boundary=",
    );
  });

  it("rewrites server action redirect headers back to relay tunnel URL", () => {
    const responseHeaders = {
      "x-action-redirect": "http://localhost:3000/dashboard?success=true",
      location: "http://localhost:3000/dashboard?success=true",
      "content-type": "text/x-component",
    };

    const normalized = NextJsServerActionsNormalizer.normalizeResponseHeaders(
      responseHeaders,
      {
        relayHost: "session-xyz.relay.paddy.systems",
        relayOrigin: "https://session-xyz.relay.paddy.systems",
      },
    );

    expect(normalized.location).toBe(
      "https://session-xyz.relay.paddy.systems/dashboard?success=true",
    );
    expect(normalized["x-action-redirect"]).toBe(
      "https://session-xyz.relay.paddy.systems/dashboard?success=true",
    );
    expect(normalized["content-type"]).toBe("text/x-component");
  });
});
