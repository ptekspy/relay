/**
 * Remix / React Router v7 Dev Adapter
 *
 * Adapts Remix and React Router v7 single-fetch data loaders, prefetch requests,
 * and client transitions over the Relay tunnel without CORS or redirect issues.
 *
 * Note for Octavia: This handles Remix _data query params and single-fetch response streaming.
 */

export interface RemixAdapterOptions {
  relayHost?: string;
  relayOrigin?: string;
  allowedOrigins?: string[];
}

export interface HeaderMap {
  [key: string]: string;
}

export class RemixReactRouterAdapter {
  private readonly relayHost: string;
  private readonly relayOrigin: string;

  constructor(options: RemixAdapterOptions = {}) {
    this.relayHost = options.relayHost ?? "localhost:7331";
    this.relayOrigin = options.relayOrigin ?? "http://localhost:7331";
  }

  public isRemixDataRequest(
    url: string,
    headers: Record<string, string | undefined>,
  ): boolean {
    if (url.includes("_data=")) return true;
    const accept = headers.accept || headers.Accept || "";
    if (accept.includes("application/x-remix-response")) return true;
    return false;
  }

  public normalizeCorsHeaders(
    originHeader: string | undefined,
    responseHeaders: Record<string, string | undefined>,
  ): HeaderMap {
    const normalized: HeaderMap = {};

    for (const [key, val] of Object.entries(responseHeaders)) {
      if (val !== undefined) {
        normalized[key.toLowerCase()] = val;
      }
    }

    if (originHeader) {
      normalized["access-control-allow-origin"] = originHeader;
      normalized["access-control-allow-credentials"] = "true";
      normalized["access-control-allow-methods"] =
        "GET, POST, PUT, DELETE, PATCH, OPTIONS";
      normalized["access-control-allow-headers"] =
        "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Remix-Redirect, X-Remix-Revalidate";
      normalized["access-control-expose-headers"] =
        "X-Remix-Redirect, X-Remix-Revalidate";
    }

    // Rewrite Remix redirect header if present
    const remixRedirect = normalized["x-remix-redirect"];
    if (
      remixRedirect &&
      (remixRedirect.startsWith("http://") ||
        remixRedirect.startsWith("https://"))
    ) {
      try {
        const parsed = new URL(remixRedirect);
        const target = new URL(this.relayOrigin);
        parsed.protocol = target.protocol;
        parsed.hostname = target.hostname;
        parsed.port = target.port;
        normalized["x-remix-redirect"] = parsed.toString();
      } catch {
        // Keep original
      }
    }

    return normalized;
  }

  public createDevMiddleware() {
    return (
      req: { url: string; headers: Record<string, string | undefined> },
      res: { setHeader: (k: string, v: string) => void },
      next: () => void,
    ) => {
      const origin = req.headers.origin;
      if (origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
      }
      next();
    };
  }
}
