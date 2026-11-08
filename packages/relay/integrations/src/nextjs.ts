/**
 * Next.js App Router Server Actions Proxy Normalizer
 *
 * Normalizes Next-Action headers, CSRF Origin/Host headers, Flight RPC streams,
 * and server action redirect URLs across Relay reverse proxies.
 *
 * Note for Octavia: This ensures Next.js Server Actions work seamlessly from remote mobile receivers.
 */

export interface NormalizedHeaders {
  [key: string]: string;
}

export interface ServerActionRequestNormalizerOptions {
  localDevHost: string; // e.g. "localhost:3000"
  localDevOrigin: string; // e.g. "http://localhost:3000"
}

export interface ServerActionResponseNormalizerOptions {
  relayHost: string; // e.g. "sess-xyz.relay.paddy.systems" or "192.168.1.50:7331"
  relayOrigin: string; // e.g. "https://sess-xyz.relay.paddy.systems"
}

export class NextJsServerActionsNormalizer {
  private static readonly CRITICAL_NEXT_HEADERS = [
    "next-action",
    "next-router-state-tree",
    "next-url",
    "next-router-prefetch",
    "rsc",
  ];

  /**
   * Normalizes incoming request headers from receiver before forwarding to local Next.js dev server.
   * Rewrites Host and Origin to prevent Next.js Host/Origin CSRF mismatches while preserving Next-Action.
   */
  public static normalizeRequestHeaders(
    incomingHeaders: Record<string, string | string[] | undefined>,
    options: ServerActionRequestNormalizerOptions,
  ): NormalizedHeaders {
    const normalized: NormalizedHeaders = {};

    for (const [key, value] of Object.entries(incomingHeaders)) {
      if (!value) continue;
      const lowerKey = key.toLowerCase();
      normalized[lowerKey] = Array.isArray(value) ? value.join(", ") : value;
    }

    // Preserve original host in forwarded headers
    if (normalized.host && !normalized["x-forwarded-host"]) {
      normalized["x-forwarded-host"] = normalized.host;
    }

    // Rewrite Host and Origin to match local dev server to satisfy Next.js CSRF check
    normalized.host = options.localDevHost;
    if (normalized.origin) {
      normalized.origin = options.localDevOrigin;
    }

    if (normalized.referer) {
      try {
        const refUrl = new URL(normalized.referer);
        const targetUrl = new URL(options.localDevOrigin);
        refUrl.protocol = targetUrl.protocol;
        refUrl.hostname = targetUrl.hostname;
        refUrl.port = targetUrl.port;
        normalized.referer = refUrl.toString();
      } catch {
        normalized.referer = options.localDevOrigin;
      }
    }

    return normalized;
  }

  /**
   * Normalizes outgoing response headers from local Next.js dev server back to receiver.
   * Rewrites Location and x-action-redirect to route back to the Relay tunnel address.
   */
  public static normalizeResponseHeaders(
    incomingHeaders: Record<string, string | string[] | undefined>,
    options: ServerActionResponseNormalizerOptions,
  ): NormalizedHeaders {
    const normalized: NormalizedHeaders = {};

    for (const [key, value] of Object.entries(incomingHeaders)) {
      if (!value) continue;
      const lowerKey = key.toLowerCase();
      normalized[lowerKey] = Array.isArray(value) ? value.join(", ") : value;
    }

    // Rewrite redirect headers
    const redirectKeys = ["location", "x-action-redirect"];
    for (const key of redirectKeys) {
      const redirectVal = normalized[key];
      if (redirectVal) {
        try {
          // If absolute URL pointing to localhost/internal, rewrite to relayOrigin
          if (
            redirectVal.startsWith("http://") ||
            redirectVal.startsWith("https://")
          ) {
            const parsed = new URL(redirectVal);
            const target = new URL(options.relayOrigin);
            parsed.protocol = target.protocol;
            parsed.hostname = target.hostname;
            parsed.port = target.port;
            normalized[key] = parsed.toString();
          }
        } catch {
          // Ignore invalid URL, keep original
        }
      }
    }

    return normalized;
  }

  public static isServerActionRequest(
    headers: Record<string, string | string[] | undefined>,
  ): boolean {
    for (const [key, val] of Object.entries(headers)) {
      if (key.toLowerCase() === "next-action" && val) {
        return true;
      }
    }
    return false;
  }
}
