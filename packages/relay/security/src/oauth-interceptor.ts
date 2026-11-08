import { randomBytes } from "node:crypto";
import { request as httpRequest } from "node:http";
import type { OAuthCallbackForwardResult, OAuthStateRecord } from "./types.js";

export class OAuthStateBridge {
  private readonly stateStore = new Map<string, OAuthStateRecord>();
  private readonly ttlMs: number;

  constructor(ttlMs = 10 * 60 * 1000) {
    this.ttlMs = ttlMs;
  }

  /**
   * Determines if an outgoing URL or redirect target is an OAuth 2.0 / OIDC authorization request.
   */
  public isOAuthAuthorizationUrl(urlStr: string): boolean {
    try {
      const url = new URL(urlStr, "http://dummy-base.local");
      const hasAuthParams =
        url.searchParams.has("client_id") &&
        (url.searchParams.get("response_type") === "code" ||
          url.searchParams.has("redirect_uri"));

      const isKnownProvider =
        url.hostname.includes("accounts.google.com") ||
        url.hostname.includes("github.com") ||
        url.hostname.includes("clerk.") ||
        url.hostname.includes("supabase.co") ||
        url.hostname.includes("auth0.com") ||
        url.pathname.includes("/oauth/authorize") ||
        url.pathname.includes("/auth/v1/authorize");

      return hasAuthParams || isKnownProvider;
    } catch {
      return false;
    }
  }

  /**
   * Rewrites an OAuth authorization URL by swapping redirect_uri with the Relay bridge endpoint.
   */
  public rewriteOAuthAuthorizationUrl(
    urlStr: string,
    callbackBridgeUrl: string,
    clientOrigin?: string,
  ): {
    rewrittenUrl: string;
    state: string;
    originalRedirectUri: string;
  } {
    const url = new URL(urlStr);
    const originalRedirectUri = url.searchParams.get("redirect_uri") || "/";
    let state = url.searchParams.get("state");

    if (!state) {
      state = randomBytes(16).toString("hex");
      url.searchParams.set("state", state);
    }

    this.stateStore.set(state, {
      state,
      originalRedirectUri,
      clientOrigin,
      createdAt: Date.now(),
    });

    url.searchParams.set("redirect_uri", callbackBridgeUrl);

    return {
      rewrittenUrl: url.toString(),
      state,
      originalRedirectUri,
    };
  }

  public getState(state: string): OAuthStateRecord | undefined {
    this.purgeExpired();
    return this.stateStore.get(state);
  }

  public consumeState(state: string): OAuthStateRecord | undefined {
    this.purgeExpired();
    const record = this.stateStore.get(state);
    if (record) {
      this.stateStore.delete(state);
    }
    return record;
  }

  public rewriteSetCookie(cookieHeader: string, targetDomain?: string): string {
    return cookieHeader
      .split(";")
      .map((part) => {
        const trimmed = part.trim();
        const lower = trimmed.toLowerCase();
        if (lower.startsWith("domain=")) {
          if (targetDomain) {
            return `Domain=${targetDomain}`;
          }
          // Stripping domain binds it strictly to the requesting host (host-only)
          return "";
        }
        return trimmed;
      })
      .filter(Boolean)
      .join("; ");
  }

  /**
   * Forwards the OAuth callback code/state to the local upstream dev server (localhost:<port>).
   */
  public async forwardCallbackToUpstream(params: {
    originalRedirectUri: string;
    queryParams: Record<string, string>;
    incomingCookies?: string;
    targetPort: number;
    userAgent?: string;
  }): Promise<OAuthCallbackForwardResult> {
    const {
      originalRedirectUri,
      queryParams,
      incomingCookies,
      targetPort,
      userAgent,
    } = params;

    let targetPath = originalRedirectUri;
    try {
      if (
        originalRedirectUri.startsWith("http://") ||
        originalRedirectUri.startsWith("https://")
      ) {
        const parsed = new URL(originalRedirectUri);
        targetPath = parsed.pathname;
      }
    } catch {
      targetPath = "/api/auth/callback";
    }

    const forwardUrl = new URL(targetPath, `http://127.0.0.1:${targetPort}`);
    for (const [key, val] of Object.entries(queryParams)) {
      forwardUrl.searchParams.set(key, val);
    }

    return new Promise((resolve) => {
      const headers: Record<string, string> = {
        host: `localhost:${targetPort}`,
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      };

      if (incomingCookies) {
        headers.cookie = incomingCookies;
      }
      if (userAgent) {
        headers["user-agent"] = userAgent;
      }

      const req = httpRequest(
        {
          hostname: "127.0.0.1",
          port: targetPort,
          path: `${forwardUrl.pathname}${forwardUrl.search}`,
          method: "GET",
          headers,
        },
        (res) => {
          const rawCookies = res.headers["set-cookie"];
          const setCookieHeaders = Array.isArray(rawCookies)
            ? rawCookies
            : rawCookies
              ? [rawCookies]
              : [];

          let location = res.headers.location;
          if (location) {
            // Normalize absolute localhost redirects back to relative paths for receiver
            try {
              if (
                location.startsWith(`http://localhost:${targetPort}`) ||
                location.startsWith(`http://127.0.0.1:${targetPort}`)
              ) {
                const locUrl = new URL(location);
                location =
                  `${locUrl.pathname}${locUrl.search}${locUrl.hash}` || "/";
              }
            } catch {
              // Keep original if unparseable
            }
          }

          let body = "";
          res.on("data", (chunk) => {
            body += chunk;
          });
          res.on("end", () => {
            resolve({
              statusCode: res.statusCode ?? 302,
              location: location || "/",
              setCookieHeaders,
              body,
            });
          });
        },
      );

      req.on("error", (err) => {
        resolve({
          statusCode: 502,
          setCookieHeaders: [],
          body: `OAuth Upstream Relay Error: ${err.message}`,
        });
      });

      req.end();
    });
  }

  private purgeExpired(): void {
    const now = Date.now();
    for (const [key, record] of this.stateStore.entries()) {
      if (now - record.createdAt > this.ttlMs) {
        this.stateStore.delete(key);
      }
    }
  }
}

export const oauthStateBridge = new OAuthStateBridge();
