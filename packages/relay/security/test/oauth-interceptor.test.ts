import { describe, expect, test } from "bun:test";
import { createServer } from "node:http";
import { OAuthStateBridge } from "../src/oauth-interceptor.js";

describe("OAuthStateBridge", () => {
  test("identifies OAuth authorization URLs accurately", () => {
    const bridge = new OAuthStateBridge();

    expect(
      bridge.isOAuthAuthorizationUrl(
        "https://accounts.google.com/o/oauth2/v2/auth?client_id=123&redirect_uri=http://localhost:3000/api/auth/callback&response_type=code",
      ),
    ).toBe(true);

    expect(
      bridge.isOAuthAuthorizationUrl(
        "https://github.com/login/oauth/authorize?client_id=gh_123&scope=user",
      ),
    ).toBe(true);

    expect(
      bridge.isOAuthAuthorizationUrl(
        "https://my-app.clerk.accounts.dev/oauth/authorize?response_type=code&client_id=clerk_abc",
      ),
    ).toBe(true);

    expect(
      bridge.isOAuthAuthorizationUrl(
        "https://xyz.supabase.co/auth/v1/authorize?provider=github",
      ),
    ).toBe(true);

    expect(
      bridge.isOAuthAuthorizationUrl("https://example.com/blog/posts"),
    ).toBe(false);
    expect(bridge.isOAuthAuthorizationUrl("/dashboard")).toBe(false);
  });

  test("rewrites authorization URL, preserving state and substituting redirect_uri", () => {
    const bridge = new OAuthStateBridge();
    const originalUrl =
      "https://accounts.google.com/o/oauth2/v2/auth?client_id=test_client&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback&response_type=code&state=client_state_123";

    const callbackBridgeUrl =
      "https://192-168-1-50.lan.paddy.systems:7331/__relay/oauth/callback";

    const result = bridge.rewriteOAuthAuthorizationUrl(
      originalUrl,
      callbackBridgeUrl,
      "https://192-168-1-50.lan.paddy.systems:7331",
    );

    expect(result.state).toBe("client_state_123");
    expect(result.originalRedirectUri).toBe(
      "http://localhost:3000/api/auth/callback",
    );

    const parsedRewritten = new URL(result.rewrittenUrl);
    expect(parsedRewritten.searchParams.get("redirect_uri")).toBe(
      callbackBridgeUrl,
    );
    expect(parsedRewritten.searchParams.get("client_id")).toBe("test_client");

    // State can be retrieved and consumed
    const stateRecord = bridge.consumeState("client_state_123");
    expect(stateRecord).toBeDefined();
    expect(stateRecord?.originalRedirectUri).toBe(
      "http://localhost:3000/api/auth/callback",
    );

    // Consuming second time returns undefined
    expect(bridge.consumeState("client_state_123")).toBeUndefined();
  });

  test("generates cryptographic state if absent in original authorization request", () => {
    const bridge = new OAuthStateBridge();
    const originalUrl =
      "https://github.com/login/oauth/authorize?client_id=gh_client&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fgithub";

    const result = bridge.rewriteOAuthAuthorizationUrl(
      originalUrl,
      "https://192-168-1-50.lan.paddy.systems:7331/__relay/oauth/callback",
    );

    expect(result.state.length).toBeGreaterThanOrEqual(16);
    const parsed = new URL(result.rewrittenUrl);
    expect(parsed.searchParams.get("state")).toBe(result.state);
  });

  test("rewrites Set-Cookie domain attributes to match client domain or strip localhost", () => {
    const bridge = new OAuthStateBridge();

    const localhostCookie =
      "__Secure-authjs.session-token=secret123; Path=/; Domain=localhost; HttpOnly; SameSite=Lax";
    const stripped = bridge.rewriteSetCookie(localhostCookie);
    expect(stripped).not.toContain("Domain=localhost");
    expect(stripped).toContain("__Secure-authjs.session-token=secret123");

    const retargeted = bridge.rewriteSetCookie(
      localhostCookie,
      "192-168-1-50.lan.paddy.systems",
    );
    expect(retargeted).toContain("Domain=192-168-1-50.lan.paddy.systems");
  });

  test("forwards OAuth callback to target dev server and returns normalized response", async () => {
    const bridge = new OAuthStateBridge();

    // Mock Upstream Dev Server
    let receivedAuthHeader = "";
    let receivedCookie = "";

    const server = createServer((req, res) => {
      receivedAuthHeader = req.headers.host ?? "";
      receivedCookie = req.headers.cookie ?? "";

      if (req.url?.includes("/api/auth/callback")) {
        res.writeHead(302, {
          Location: "http://localhost:4499/dashboard",
          "Set-Cookie":
            "session_token=valid_token_xyz; Path=/; HttpOnly; SameSite=Lax",
        });
        res.end();
        return;
      }
      res.writeHead(404);
      res.end();
    });

    await new Promise<void>((resolve) =>
      server.listen(4499, "127.0.0.1", resolve),
    );

    try {
      const forwardResult = await bridge.forwardCallbackToUpstream({
        originalRedirectUri: "http://localhost:4499/api/auth/callback",
        queryParams: { code: "oauth_code_abc", state: "state_123" },
        incomingCookies: "pkce_verifier=verifier_secret_999",
        targetPort: 4499,
      });

      expect(forwardResult.statusCode).toBe(302);
      expect(forwardResult.location).toBe("/dashboard"); // Normalized from http://localhost:4499/dashboard
      expect(forwardResult.setCookieHeaders.length).toBe(1);
      expect(forwardResult.setCookieHeaders[0]).toContain(
        "session_token=valid_token_xyz",
      );

      expect(receivedAuthHeader).toBe("localhost:4499");
      expect(receivedCookie).toBe("pkce_verifier=verifier_secret_999");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
