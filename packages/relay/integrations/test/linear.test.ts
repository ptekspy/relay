import { describe, expect, it } from "bun:test";
import { LinearClient } from "../src/linear.js";

describe("TASK-171: Linear API Integration for Bug Creation", () => {
  it("formats markdown description with device specs and replay session URL", () => {
    const client = new LinearClient("lin_api_key_123");
    const desc = client.formatMarkdownDescription({
      title: "Button layout shifted on mobile",
      teamId: "team_eng",
      description: "Observed unexpected margin-top on primary CTA button.",
      deviceSpecs: {
        model: "Pixel 8",
        os: "Android 14",
        viewport: "412x915",
        dpr: 2.625,
      },
      replayUrl: "https://relay.paddy.systems/replay/rep_9911",
      sessionId: "sess_mobile_01",
    });

    expect(desc).toContain("Observed unexpected margin-top");
    expect(desc).toContain("Pixel 8");
    expect(desc).toContain("Android 14");
    expect(desc).toContain("https://relay.paddy.systems/replay/rep_9911");
    expect(desc).toContain("sess_mobile_01");
  });

  it("creates issue in under 1 second with mock transport", async () => {
    const client = new LinearClient("lin_api_key_123");
    const startTime = performance.now();

    const result = await client.createIssue(
      {
        title: "Cart counter does not decrement",
        teamId: "team_web",
        description: "Clicking minus button does not update state.",
        priority: 1, // Urgent
      },
      async (_endpoint, body, headers) => {
        expect(headers.Authorization).toBe("lin_api_key_123");
        expect(body).toContain("Cart counter does not decrement");
        return {
          status: 200,
          data: {
            id: "issue-abc-123",
            identifier: "REL-555",
          },
        };
      },
    );

    const elapsedMs = performance.now() - startTime;

    expect(result.identifier).toBe("REL-555");
    expect(result.url).toBe("https://linear.app/paddy-systems/issue/REL-555");
    expect(elapsedMs).toBeLessThan(1000); // Created in < 1 second
  });

  it("throws descriptive error on API failure status", async () => {
    const client = new LinearClient("lin_bad_key");

    expect(
      client.createIssue(
        {
          title: "Crash on launch",
          teamId: "team_core",
          description: "Segfault observed",
        },
        async () => ({ status: 401 }),
      ),
    ).rejects.toThrow("Linear API request failed with status: 401");
  });
});
