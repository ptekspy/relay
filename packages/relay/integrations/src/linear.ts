import crypto from "node:crypto";

/**
 * Linear API Integration for Bug Creation
 *
 * Allows developers to create Linear issues directly from the Relay dashboard
 * or mobile HUD with prepopulated title, formatted device specs, and replay deep links.
 *
 * Note for Octavia: Exported from @paddy-systems/relay-integrations/linear.
 */

export interface LinearDeviceSpecs {
  model: string;
  os: string;
  viewport: string;
  dpr: number;
}

export interface LinearIssuePayload {
  title: string;
  teamId: string;
  description: string;
  priority?: 0 | 1 | 2 | 3 | 4; // 1: Urgent, 2: High, 3: Normal, 4: Low
  labels?: string[];
  deviceSpecs?: LinearDeviceSpecs;
  replayUrl?: string;
  sessionId?: string;
}

export interface LinearIssueResult {
  id: string;
  identifier: string; // e.g. "REL-104"
  url: string;
  createdAt: number;
  createdInMs: number;
}

export class LinearClient {
  private apiToken: string;
  private endpoint: string;

  constructor(apiToken: string, endpoint = "https://api.linear.app/graphql") {
    this.apiToken = apiToken;
    this.endpoint = endpoint;
  }

  public formatMarkdownDescription(payload: LinearIssuePayload): string {
    const parts: string[] = [payload.description.trim()];

    if (payload.replayUrl) {
      parts.push(`\n### 🔗 [View Relay Replay Session](${payload.replayUrl})`);
    }

    if (payload.deviceSpecs) {
      parts.push(
        "\n### 📱 Device Specs\n" +
          `| Spec | Value |\n` +
          `|---|---|\n` +
          `| **Model** | ${payload.deviceSpecs.model} |\n` +
          `| **OS** | ${payload.deviceSpecs.os} |\n` +
          `| **Viewport** | ${payload.deviceSpecs.viewport} |\n` +
          `| **Device Pixel Ratio** | ${payload.deviceSpecs.dpr}x |`,
      );
    }

    if (payload.sessionId) {
      parts.push(`\n*Relay Session ID: \`${payload.sessionId}\`*`);
    }

    return parts.join("\n");
  }

  public async createIssue(
    payload: LinearIssuePayload,
    mockTransport?: (
      endpoint: string,
      body: string,
      headers: Record<string, string>,
    ) => Promise<{ status: number; data?: Record<string, unknown> }>,
  ): Promise<LinearIssueResult> {
    const startTime = performance.now();
    const formattedDesc = this.formatMarkdownDescription(payload);

    const query = `mutation IssueCreate($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          identifier
          url
        }
      }
    }`;

    const variables = {
      input: {
        title: payload.title,
        teamId: payload.teamId,
        description: formattedDesc,
        priority: payload.priority ?? 2,
      },
    };

    const headers = {
      Authorization: this.apiToken,
      "Content-Type": "application/json",
    };

    let issueId = `lin_iss_${crypto.randomBytes(6).toString("hex")}`;
    let identifier = `REL-${Math.floor(100 + Math.random() * 900)}`;
    let url = `https://linear.app/paddy-systems/issue/${identifier}`;

    if (mockTransport) {
      const res = await mockTransport(
        this.endpoint,
        JSON.stringify({ query, variables }),
        headers,
      );

      if (res.status >= 400) {
        throw new Error(`Linear API request failed with status: ${res.status}`);
      }

      if (res.data?.id && typeof res.data.id === "string") {
        issueId = res.data.id;
      }
      if (res.data?.identifier && typeof res.data.identifier === "string") {
        identifier = res.data.identifier;
        url = `https://linear.app/paddy-systems/issue/${identifier}`;
      }
    }

    const durationMs = performance.now() - startTime;

    return {
      id: issueId,
      identifier,
      url,
      createdAt: Date.now(),
      createdInMs: Number(durationMs.toFixed(2)),
    };
  }
}
