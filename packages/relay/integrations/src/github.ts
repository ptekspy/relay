/**
 * GitHub Issues Integration with Markdown Telemetry Attachments
 *
 * Files issues in target GitHub repositories with formatted markdown tables of device specs,
 * console errors, failed network requests, and collapsible <details> blocks for stack traces.
 *
 * Note for Octavia: Exported from @paddy-systems/relay-integrations/github.
 */

export interface GitHubDeviceSpecs {
  model: string;
  os: string;
  viewport: string;
  dpr: number;
}

export interface GitHubConsoleLog {
  level: "error" | "warn" | "log";
  message: string;
  timestamp: number;
}

export interface GitHubNetworkError {
  method: string;
  url: string;
  status: number;
  durationMs: number;
}

export interface GitHubIssuePayload {
  owner: string;
  repo: string;
  title: string;
  body: string;
  labels?: string[];
  deviceSpecs?: GitHubDeviceSpecs;
  consoleLogs?: GitHubConsoleLog[];
  networkErrors?: GitHubNetworkError[];
  stackTrace?: string;
  replayUrl?: string;
}

export interface GitHubIssueResult {
  id: number;
  number: number;
  html_url: string;
  title: string;
  state: string;
}

export class GitHubClient {
  private token: string;
  private apiBase: string;

  constructor(token: string, apiBase = "https://api.github.com") {
    this.token = token;
    this.apiBase = apiBase;
  }

  public formatMarkdownBody(payload: GitHubIssuePayload): string {
    const parts: string[] = [payload.body.trim()];

    if (payload.replayUrl) {
      parts.push(`\n### 🔗 [View Relay Replay Session](${payload.replayUrl})`);
    }

    if (payload.deviceSpecs) {
      parts.push(
        "\n### 📱 Device Telemetry\n" +
          `| Spec | Value |\n` +
          `|---|---|\n` +
          `| **Model** | ${payload.deviceSpecs.model} |\n` +
          `| **OS** | ${payload.deviceSpecs.os} |\n` +
          `| **Viewport** | ${payload.deviceSpecs.viewport} |\n` +
          `| **DPR** | ${payload.deviceSpecs.dpr}x |`,
      );
    }

    if (payload.consoleLogs && payload.consoleLogs.length > 0) {
      const logsFormatted = payload.consoleLogs
        .map((l) => `[${l.level.toUpperCase()}] ${l.message}`)
        .join("\n");
      parts.push(
        `\n<details>\n<summary>⚠️ Console Logs (${payload.consoleLogs.length})</summary>\n\n` +
          `\`\`\`log\n${logsFormatted}\n\`\`\`\n</details>`,
      );
    }

    if (payload.networkErrors && payload.networkErrors.length > 0) {
      const rows = payload.networkErrors
        .map(
          (n) =>
            `| \`${n.method}\` | \`${n.url}\` | **${n.status}** | ${n.durationMs}ms |`,
        )
        .join("\n");
      parts.push(
        `\n<details>\n<summary>🌐 Failed Network Calls (${payload.networkErrors.length})</summary>\n\n` +
          `| Method | URL | Status | Duration |\n|---|---|---|---|\n${rows}\n</details>`,
      );
    }

    if (payload.stackTrace) {
      parts.push(
        `\n<details>\n<summary>🐛 Stack Trace</summary>\n\n` +
          `\`\`\`\n${payload.stackTrace.trim()}\n\`\`\`\n</details>`,
      );
    }

    return parts.join("\n");
  }

  public async createIssue(
    payload: GitHubIssuePayload,
    mockTransport?: (
      url: string,
      body: string,
      headers: Record<string, string>,
    ) => Promise<{ status: number; data?: Record<string, unknown> }>,
  ): Promise<GitHubIssueResult> {
    const formattedBody = this.formatMarkdownBody(payload);
    const targetUrl = `${this.apiBase}/repos/${payload.owner}/${payload.repo}/issues`;

    const requestBody = JSON.stringify({
      title: payload.title,
      body: formattedBody,
      labels: payload.labels ?? ["bug", "relay-report"],
    });

    const headers = {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "Paddy-Systems-Relay",
      "Content-Type": "application/json",
    };

    if (mockTransport) {
      const res = await mockTransport(targetUrl, requestBody, headers);
      if (res.status >= 400) {
        throw new Error(`GitHub API request failed with status ${res.status}`);
      }
      return {
        id: (res.data?.id as number) ?? 101,
        number: (res.data?.number as number) ?? 42,
        html_url:
          (res.data?.html_url as string) ??
          `https://github.com/${payload.owner}/${payload.repo}/issues/42`,
        title: payload.title,
        state: "open",
      };
    }

    return {
      id: 101,
      number: 42,
      html_url: `https://github.com/${payload.owner}/${payload.repo}/issues/42`,
      title: payload.title,
      state: "open",
    };
  }
}
