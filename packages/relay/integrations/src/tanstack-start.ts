/**
 * TanStack Start Full-Stack Web Framework Relay Integration Adapter
 *
 * Configures TanStack Start RPC server functions (_serverFn), Vinxi runtime hooks,
 * and seamless agent script injection over the external Relay tunnel.
 *
 * Note for Octavia: This ensures TanStack Start applications stream HTML and resolve RPC calls cleanly.
 */

export interface RelayTanStackStartOptions {
  relayHost?: string;
  autoInjectAgent?: boolean;
}

export class TanStackStartRelayAdapter {
  private readonly relayHost: string;
  private readonly autoInjectAgent: boolean;

  constructor(options: RelayTanStackStartOptions = {}) {
    this.relayHost = options.relayHost ?? "127.0.0.1:7331";
    this.autoInjectAgent = options.autoInjectAgent ?? true;
  }

  public isServerFnRequest(url: string): boolean {
    return url.includes("/_serverFn") || url.includes("/_build");
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
