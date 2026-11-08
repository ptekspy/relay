import { describe, expect, it } from "bun:test";
import { RelayActionCommentBuilder } from "../src/github-action.js";

describe("TASK-187: GitHub Action for Relay Ephemeral Preview Tunnels (relay-action)", () => {
  it("formats scan-ready PR comment markdown with QR code and mobile link", () => {
    const comment = RelayActionCommentBuilder.formatPrComment({
      tunnelUrl: "https://pr-42.relay.paddy.systems",
      lanUrl: "http://127.0.0.1:7331",
      qrCodeDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      branch: "feat/checkout-flow",
      commitSha: "a1b2c3d4e5f6",
      sessionId: "sess_ci_pr_42",
    });

    expect(comment).toContain("### ⚡ Relay Mobile Preview Tunnel Ready");
    expect(comment).toContain("feat/checkout-flow");
    expect(comment).toContain(
      "[![Scan QR Code](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...)]",
    );
    expect(comment).toContain(
      "👉 **[Open Mobile Preview (https://pr-42.relay.paddy.systems)]",
    );
    expect(comment).toContain("`sess_ci_pr_42`");
    expect(comment).toContain("`a1b2c3d`");
  });

  it("posts PR comment to GitHub Issues API endpoint", async () => {
    let capturedUrl = "";
    let capturedHeaders: Record<string, string> = {};
    let capturedBody = "";

    const mockFetch = (async (url: string, init?: RequestInit) => {
      capturedUrl = url;
      capturedHeaders = init?.headers as Record<string, string>;
      capturedBody = init?.body as string;

      return {
        ok: true,
        status: 201,
        json: async () => ({
          id: 987654321,
          html_url:
            "https://github.com/Paddy-Systems/p-s-core/pull/42#issuecomment-987654321",
        }),
      } as Response;
    }) as unknown as typeof fetch;

    const res = await RelayActionCommentBuilder.postPrComment(
      {
        githubToken: "ghp_fake_pr_comment_token",
        repo: "Paddy-Systems/p-s-core",
        issueNumber: 42,
        body: "Mock QR code comment content",
      },
      mockFetch,
    );

    expect(capturedUrl).toBe(
      "https://api.github.com/repos/Paddy-Systems/p-s-core/issues/42/comments",
    );
    expect(capturedHeaders.Authorization).toBe(
      "Bearer ghp_fake_pr_comment_token",
    );
    expect(capturedBody).toContain("Mock QR code comment content");
    expect(res.id).toBe(987654321);
  });
});
