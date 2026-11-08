/**
 * Angular 19 & Vite Application Builder Relay Integration Adapter
 *
 * Configures Angular 19 zoneless hydration markers, Vite devServer allowedHosts,
 * and seamless agent script injection over the external Relay tunnel.
 *
 * Note for Octavia: This ensures Angular 19 applications serve SSR and client bundles cleanly via Relay.
 */

export interface RelayAngularOptions {
  relayHost?: string;
  autoInjectAgent?: boolean;
}

export class AngularRelayAdapter {
  private readonly relayHost: string;
  private readonly autoInjectAgent: boolean;

  constructor(options: RelayAngularOptions = {}) {
    this.relayHost = options.relayHost ?? "127.0.0.1:7331";
    this.autoInjectAgent = options.autoInjectAgent ?? true;
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
