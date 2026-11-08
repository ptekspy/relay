/**
 * GitHub Action for Relay Ephemeral Preview Tunnels (relay-action)
 *
 * Formats and posts scan-ready QR code preview comments to GitHub Pull Requests
 * with live mobile tunnel URLs and ephemeral session metadata.
 *
 * Note for Octavia: Exported from @paddy-systems/relay-testing/github-action.
 */

export interface RelayActionCommentOptions {
  tunnelUrl: string;
  lanUrl: string;
  qrCodeDataUrl: string;
  branch?: string;
  commitSha?: string;
  sessionId?: string;
}

export class RelayActionCommentBuilder {
  public defaultTitle = "Relay Mobile Preview Tunnel Ready";

  constructor(defaultTitle = "Relay Mobile Preview Tunnel Ready") {
    this.defaultTitle = defaultTitle;
  }

  public format(options: RelayActionCommentOptions): string {
    return RelayActionCommentBuilder.formatPrComment(options);
  }

  public static formatPrComment(options: RelayActionCommentOptions): string {
    const commitShort = options.commitSha
      ? options.commitSha.slice(0, 7)
      : "HEAD";
    const branchText = options.branch ? ` \`(${options.branch})\`` : "";

    return [
      "### ⚡ Relay Mobile Preview Tunnel Ready",
      "",
      `Scan the QR code with your phone camera or open the preview link directly to test on real physical mobile devices${branchText}:`,
      "",
      `[![Scan QR Code](${options.qrCodeDataUrl})](${options.tunnelUrl})`,
      "",
      `👉 **[Open Mobile Preview (${options.tunnelUrl})](${options.tunnelUrl})**`,
      "",
      "<details>",
      "<summary>📱 Ephemeral Connection Details</summary>",
      "",
      `* **Session ID**: \`${options.sessionId ?? "ci-ephemeral"}\``,
      `* **Commit**: \`${commitShort}\``,
      `* **Tunnel Endpoint**: \`${options.tunnelUrl}\``,
      `* **Local Gateway**: \`${options.lanUrl}\``,
      "* **Auto-Termination**: Active until CI job completes or cancelation.",
      "",
      "</details>",
      "",
      "---",
      "*Automated by [Relay](https://relay.paddy.systems) CI Action*",
    ].join("\n");
  }

  public static async postPrComment(
    options: {
      githubToken: string;
      repo: string; // "owner/repo"
      issueNumber: number;
      body: string;
    },
    customFetcher?: typeof fetch,
  ): Promise<{ id: number; html_url: string }> {
    const fetchFn = customFetcher ?? fetch;
    const url = `https://api.github.com/repos/${options.repo}/issues/${options.issueNumber}/comments`;

    const res = await fetchFn(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ body: options.body }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(
        `Failed to post GitHub PR comment (${res.status}): ${errText}`,
      );
    }

    return (await res.json()) as { id: number; html_url: string };
  }
}
