/**
 * SNI Dynamic Subdomain Routing Engine
 *
 * Resolves incoming HTTP/TLS Host headers matching `*.relay.paddy.systems`
 * to the appropriate persistent tunnel endpoint, or produces structured
 * error responses for unknown/expired sessions.
 *
 * Note for Octavia: This router manages subdomain extraction and session binding.
 */

export interface TunnelEndpoint {
  sessionId: string;
  hostConnectionId: string;
  region: string;
  createdAt: string;
  expiresAt: string;
}

export interface RouteResolutionSuccess {
  found: true;
  sessionId: string;
  endpoint: TunnelEndpoint;
}

export interface RouteResolutionFailure {
  found: false;
  sessionId: string | null;
  errorCode:
    | "ERR_SESSION_NOT_FOUND"
    | "ERR_INVALID_HOST"
    | "ERR_SESSION_EXPIRED";
  htmlResponse: string;
}

export type RouteResolutionResult =
  | RouteResolutionSuccess
  | RouteResolutionFailure;

export class SniDynamicRouter {
  private readonly baseDomains: string[];
  private readonly routes = new Map<string, TunnelEndpoint>();

  constructor(baseDomains: string[] = ["relay.paddy.systems", "relay.zone"]) {
    this.baseDomains = baseDomains.map((d) => d.toLowerCase());
  }

  public registerTunnel(endpoint: TunnelEndpoint): void {
    this.routes.set(endpoint.sessionId.toLowerCase(), endpoint);
  }

  public unregisterTunnel(sessionId: string): boolean {
    return this.routes.delete(sessionId.toLowerCase());
  }

  public getActiveRouteCount(): number {
    return this.routes.size;
  }

  public extractSessionIdFromHost(hostHeader: string): string | null {
    if (!hostHeader) return null;
    const rawHost = hostHeader.split(":")[0];
    if (!rawHost) return null;
    const cleanHost = rawHost.toLowerCase().trim();

    for (const baseDomain of this.baseDomains) {
      if (cleanHost === baseDomain || cleanHost === `www.${baseDomain}`) {
        return null;
      }
      if (cleanHost.endsWith(`.${baseDomain}`)) {
        const prefix = cleanHost.slice(
          0,
          cleanHost.length - baseDomain.length - 1,
        );
        // Supports both <sessionId> and <sessionId>.<region>
        const parts = prefix.split(".");
        return parts[0] || null;
      }
    }

    return null;
  }

  public resolveHost(
    hostHeader: string,
    now: Date = new Date(),
  ): RouteResolutionResult {
    const sessionId = this.extractSessionIdFromHost(hostHeader);

    if (!sessionId) {
      return {
        found: false,
        sessionId: null,
        errorCode: "ERR_INVALID_HOST",
        htmlResponse: this.generateErrorPage(
          "Invalid Relay Host",
          "The requested hostname is not a valid Relay tunnel address.",
          "ERR_INVALID_HOST",
        ),
      };
    }

    const endpoint = this.routes.get(sessionId.toLowerCase());
    if (!endpoint) {
      return {
        found: false,
        sessionId,
        errorCode: "ERR_SESSION_NOT_FOUND",
        htmlResponse: this.generateErrorPage(
          "Session Not Found",
          `Relay session "${sessionId}" does not exist or has been terminated.`,
          "ERR_SESSION_NOT_FOUND",
        ),
      };
    }

    const expiresAt = new Date(endpoint.expiresAt);
    if (now > expiresAt) {
      this.routes.delete(sessionId.toLowerCase());
      return {
        found: false,
        sessionId,
        errorCode: "ERR_SESSION_EXPIRED",
        htmlResponse: this.generateErrorPage(
          "Session Expired",
          `Relay session "${sessionId}" has expired. Please restart your CLI session to obtain a new tunnel.`,
          "ERR_SESSION_EXPIRED",
        ),
      };
    }

    return {
      found: true,
      sessionId,
      endpoint,
    };
  }

  private generateErrorPage(
    title: string,
    message: string,
    code: string,
  ): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Relay — ${title}</title>
  <style>
    body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background: #080808; color: #f4f4f4; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; }
    .card { background: #141414; border: 1px solid #282828; border-radius: 12px; padding: 32px; max-width: 480px; width: 100%; box-shadow: 0 12px 36px rgba(0,0,0,0.4); }
    h1 { font-size: 20px; font-weight: 600; color: #ff5555; margin: 0 0 12px 0; }
    p { font-size: 14px; color: #a0a0a0; line-height: 1.6; margin: 0 0 20px 0; }
    .badge { display: inline-block; background: #221414; color: #ff7777; border: 1px solid #442222; font-size: 12px; padding: 4px 8px; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="badge">Code: ${code}</div>
  </div>
</body>
</html>`;
  }
}
