import { describe, expect, it } from "bun:test";
import { GitHubClient } from "../src/github.js";
import { JiraCloudClient } from "../src/jira.js";
import { LinearClient } from "../src/linear.js";
import {
  IntegrationHttpError,
  IntegrationResilienceManager,
} from "../src/resilience.js";

describe("TASK-180: Issue Tracker Integration Contract & Failure Resilience Tests", () => {
  const manager = new IntegrationResilienceManager();

  it("recovers from HTTP 429 rate limiting with backoff", async () => {
    let callCount = 0;

    const { result, attempts } = await manager.executeWithRetry(
      async () => {
        callCount++;
        if (callCount < 3) {
          throw new IntegrationHttpError(429, "Rate limit exceeded", 10);
        }
        return { ticketId: "REL-999" };
      },
      { maxRetries: 3, initialDelayMs: 5 },
    );

    expect(attempts).toBe(3);
    expect(result.ticketId).toBe("REL-999");
  });

  it("recovers from HTTP 502 / 500 gateway errors with zero data loss", async () => {
    let callCount = 0;
    const client = new LinearClient("lin_resilient_key");

    const payload = {
      title: "Resilient ticket creation test",
      teamId: "team_infra",
      description: "Testing network fault tolerance",
    };

    const { result, attempts } = await manager.executeWithRetry(
      async () => {
        callCount++;
        if (callCount === 1) {
          throw new IntegrationHttpError(502, "Bad Gateway");
        }
        return client.createIssue(payload, async () => ({
          status: 200,
          data: { id: "lin-res-1", identifier: "REL-777" },
        }));
      },
      { maxRetries: 3, initialDelayMs: 5 },
    );

    expect(attempts).toBe(2);
    expect(result.identifier).toBe("REL-777");
  });

  it("fails gracefully and propagates error if external API repeatedly returns 500", async () => {
    let callCount = 0;

    expect(
      manager.executeWithRetry(
        async () => {
          callCount++;
          throw new IntegrationHttpError(500, "Internal Server Error");
        },
        { maxRetries: 2, initialDelayMs: 5 },
      ),
    ).rejects.toThrow("Internal Server Error");

    // Initial attempt (1) + 2 retries = 3 calls
    expect(callCount).toBe(3);
  });

  it("validates end-to-end failure contracts across GitHub and Jira", async () => {
    const ghClient = new GitHubClient("ghp_resilient_token");
    let ghAttempts = 0;

    const ghResult = await manager.executeWithRetry(
      async () => {
        ghAttempts++;
        if (ghAttempts === 1) {
          throw new IntegrationHttpError(503, "Service Unavailable");
        }
        return ghClient.createIssue(
          {
            owner: "Paddy-Systems",
            repo: "p-s-core",
            title: "Resilience verified",
            body: "Verified automated retry contract",
          },
          async () => ({
            status: 201,
            data: { id: 777, number: 99, html_url: "https://github.com/..." },
          }),
        );
      },
      { maxRetries: 2, initialDelayMs: 5 },
    );

    expect(ghAttempts).toBe(2);
    expect(ghResult.result.number).toBe(99);

    const jiraClient = new JiraCloudClient(
      "acme.atlassian.net",
      "test@acme.com",
      "tok",
    );
    let jiraAttempts = 0;

    const jiraResult = await manager.executeWithRetry(
      async () => {
        jiraAttempts++;
        if (jiraAttempts === 1) {
          throw new IntegrationHttpError(429, "Too Many Requests");
        }
        return jiraClient.createIssue(
          {
            projectKey: "RELAY",
            summary: "Resilient Jira Issue",
            descriptionText: "No data lost across rate limits",
          },
          async () => ({
            status: 201,
            data: { id: "109", key: "RELAY-109" },
          }),
        );
      },
      { maxRetries: 2, initialDelayMs: 5 },
    );

    expect(jiraAttempts).toBe(2);
    expect(jiraResult.result.key).toBe("RELAY-109");
  });
});
