import { describe, expect, it } from "bun:test";
import { JiraCloudClient } from "../src/jira.js";

describe("TASK-173: Jira Cloud Integration with Automated Issue Linking", () => {
  it("generates valid Atlassian Document Format (ADF) description tree", () => {
    const client = new JiraCloudClient(
      "acme.atlassian.net",
      "dev@acme.com",
      "api_token_abc",
    );

    const doc = client.buildAdfDocument({
      projectKey: "PROJ",
      summary: "White screen on payment modal",
      descriptionText: "App crashed unexpectedly during stripe tokenization.",
      replayUrl: "https://relay.paddy.systems/replay/rep_stripe_01",
      deviceInfo: {
        model: "Pixel 7a",
        os: "Android 13",
        resolution: "1080x2400",
      },
    });

    expect(doc.version).toBe(1);
    expect(doc.type).toBe("doc");
    expect(doc.content.length).toBe(3); // text paragraph, replay link paragraph, bullet list

    const replayNode = doc.content[1] as Record<string, unknown>;
    expect(replayNode.type).toBe("paragraph");

    const bulletNode = doc.content[2] as Record<string, unknown>;
    expect(bulletNode.type).toBe("bulletList");
  });

  it("creates issue via Jira REST API v3 with project key and priority", async () => {
    const client = new JiraCloudClient(
      "paddy.atlassian.net",
      "sally@paddy.systems",
      "token_xyz",
    );

    let sentAuth = "";
    let sentBody: Record<string, unknown> = {};

    const result = await client.createIssue(
      {
        projectKey: "RELAY",
        summary: "Dropdown z-index collision on mobile safari",
        descriptionText: "Menu is hidden behind floating action button.",
        issueType: "Bug",
        priority: "High",
      },
      async (_url, body, headers) => {
        sentAuth = headers.Authorization ?? "";
        sentBody = JSON.parse(body);
        return {
          status: 201,
          data: {
            id: "14022",
            key: "RELAY-204",
          },
        };
      },
    );

    expect(sentAuth.startsWith("Basic ")).toBe(true);
    expect((sentBody.fields as Record<string, unknown>).summary).toBe(
      "Dropdown z-index collision on mobile safari",
    );
    expect(result.key).toBe("RELAY-204");
    expect(result.webUrl).toBe("https://paddy.atlassian.net/browse/RELAY-204");
  });
});
