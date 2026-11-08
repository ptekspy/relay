/**
 * Qwik City & Resumability Relay Integration Adapter
 *
 * Configures fine-grained resumable symbol manifest resolution (q-data.json),
 * container state attributes, and agent script injection without breaking serialization.
 *
 * Note for Octavia: This ensures Qwik applications hydrate zero JavaScript on initial load while Relay agent functions.
 */

export interface RelayQwikOptions {
  relayHost?: string;
  autoInjectAgent?: boolean;
}

export class QwikCityRelayAdapter {
  private readonly relayHost: string;
  private readonly autoInjectAgent: boolean;

  constructor(options: RelayQwikOptions = {}) {
    this.relayHost = options.relayHost ?? "127.0.0.1:7331";
    this.autoInjectAgent = options.autoInjectAgent ?? true;
  }

  public isQwikDataRequest(url: string): boolean {
    return url.includes("q-data.json") || url.includes("/q-");
  }

  public normalizeHeaders(
    incomingHeaders: Record<string, string | string[] | undefined>,
  ): Record<string, string> {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(incomingHeaders)) {
      if (typeof value === "string") {
        normalized[key.toLowerCase()] = value;
      } else if (Array.isArray(value)) {
        normalized[key.toLowerCase()] = value.join(", ");
      }
    }

    if (!normalized["x-forwarded-host"]) {
      normalized["x-forwarded-host"] = this.relayHost;
    }
    return normalized;
  }

  public injectAgentScript(html: string): string {
    if (!this.autoInjectAgent) return html;
    const script = '<script src="/agent.js" async></script>';
    if (html.includes("</head>")) {
      return html.replace("</head>", `${script}</head>`);
    }
    return html.replace("</body>", `${script}</body>`);
  }
}
