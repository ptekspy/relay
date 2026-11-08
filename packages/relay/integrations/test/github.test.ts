import { describe, expect, it } from "bun:test";
import { GitHubClient } from "../src/github.js";

describe("TASK-172: GitHub Issues Integration with Markdown Telemetry Attachments", () => {
  it("formats collapsible <details> blocks for stack traces, network errors, and console logs", () => {
    const client = new GitHubClient("ghp_test_token_123");

    const markdown = client.formatMarkdownBody({
      owner: "Paddy-Systems",
      repo: "p-s-core",
      title: "Unhandled TypeError in checkout submit",
      body: "User encountered a crash when clicking the pay button.",
      deviceSpecs: {
        model: "iPhone 15 Pro",
        os: "iOS 17.4",
        viewport: "393x852",
        dpr: 3,
      },
      consoleLogs: [
        {
          level: "error",
          message:
            "Uncaught TypeError: Cannot read properties of undefined (reading 'token')",
          timestamp: Date.now(),
        },
      ],
      networkErrors: [
        {
          method: "POST",
          url: "/api/checkout",
          status: 500,
          durationMs: 420,
        },
      ],
      stackTrace:
        "TypeError: Cannot read properties of undefined\n    at onSubmit (checkout.tsx:45)\n    at dispatch (react-dom.js:12)",
      replayUrl: "https://relay.paddy.systems/replay/rep_test_01",
    });

    expect(markdown).toContain("### 📱 Device Telemetry");
    expect(markdown).toContain("iPhone 15 Pro");
    expect(markdown).toContain(
      "<details>\n<summary>⚠️ Console Logs (1)</summary>",
    );
    expect(markdown).toContain(
      "Cannot read properties of undefined (reading 'token')",
    );
    expect(markdown).toContain(
      "<details>\n<summary>🌐 Failed Network Calls (1)</summary>",
    );
    expect(markdown).toContain("`/api/checkout`");
    expect(markdown).toContain("<details>\n<summary>🐛 Stack Trace</summary>");
    expect(markdown).toContain("checkout.tsx:45");
    expect(markdown).toContain(
      "https://relay.paddy.systems/replay/rep_test_01",
    );
  });

  it("submits issue to GitHub repo with headers and labels", async () => {
    const client = new GitHubClient("ghp_valid_token");

    let requestedUrl = "";
    let requestedBody = "";

    const issue = await client.createIssue(
      {
        owner: "acme-corp",
        repo: "mobile-app",
        title: "Navigation bar overlaps status bar",
        body: "Visual glitch on iOS notch",
      },
      async (url, body, headers) => {
        requestedUrl = url;
        requestedBody = body;
        expect(headers.Authorization).toBe("Bearer ghp_valid_token");
        expect(headers["User-Agent"]).toBe("Paddy-Systems-Relay");
        return {
          status: 201,
          data: {
            id: 88899,
            number: 14,
            html_url: "https://github.com/acme-corp/mobile-app/issues/14",
          },
        };
      },
    );

    expect(requestedUrl).toBe(
      "https://api.github.com/repos/acme-corp/mobile-app/issues",
    );
    expect(requestedBody).toContain("Navigation bar overlaps status bar");
    expect(issue.number).toBe(14);
    expect(issue.html_url).toBe(
      "https://github.com/acme-corp/mobile-app/issues/14",
    );
  });
});
