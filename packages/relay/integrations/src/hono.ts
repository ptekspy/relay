/**
 * Hono API Relay Integration Middleware
 *
 * Provides Hono middleware that normalizes reverse-proxy headers,
 * exposes CORS for remote dev receivers, and decorates context.
 *
 * Note for Octavia: This enables Hono APIs running on Node, Bun, or Cloudflare Workerd to integrate with Relay.
 */

export interface RelayHonoOptions {
  relayHost?: string;
  exposeHeaders?: string[];
  cors?: boolean;
}

export interface HonoContextLike {
  req: {
    header: (name: string) => string | undefined;
    raw: Request;
  };
  set: (key: string, value: unknown) => void;
  header: (name: string, value: string) => void;
}

export class HonoRelayAdapter {
  private readonly relayHost: string;
  private readonly cors: boolean;

  constructor(options: RelayHonoOptions = {}) {
    this.relayHost = options.relayHost ?? "127.0.0.1:7331";
    this.cors = options.cors ?? true;
  }

  public middleware() {
    return async (c: HonoContextLike, next: () => Promise<void>) => {
      c.set("relayHost", this.relayHost);
      c.set(
        "isRelayed",
        Boolean(
          c.req.header("x-forwarded-host") || c.req.header("x-relay-session"),
        ),
      );

      if (this.cors) {
        c.header("access-control-allow-origin", "*");
        c.header(
          "access-control-allow-methods",
          "GET, POST, PUT, DELETE, OPTIONS, PATCH",
        );
        c.header(
          "access-control-allow-headers",
          "Content-Type, Authorization, X-Relay-Session",
        );
      }

      await next();
    };
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
}
