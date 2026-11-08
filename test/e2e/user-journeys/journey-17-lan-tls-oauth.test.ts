import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createServer as createHttpServer, type Server } from "node:http";
import {
  type RelayGateway,
  startRelayGateway,
} from "../../../apps/relay/cli/src/gateway.js";

describe("User Journey 17: Local Wildcard TLS & OAuth Loopback Rewriting", () => {
  let devServer: Server;
  const devPort = 4550;
  const gatewayPort = 7890;
  const sessionToken = "tok_test_e2e_oauth_1234567890";
  let gateway: RelayGateway;

  beforeAll(async () => {
    // 1. Upstream Dev Server simulating NextAuth / Supabase / Clerk authentication
    devServer = createHttpServer((req, res) => {
      const url = new URL(req.url ?? "/", `http://localhost:${devPort}`);

      if (url.pathname === "/auth/google") {
        // App initiates OAuth: sets PKCE cookie and redirects to Google
        res.writeHead(302, {
          location: `https://accounts.google.com/o/oauth2/v2/auth?client_id=google_client_app&redirect_uri=http://localhost:${devPort}/api/auth/callback&response_type=code&state=orig_state_777`,
          "set-cookie":
            "__pkce_code_verifier=pkce_secret_hash_999; Path=/; HttpOnly; SameSite=Lax",
        });
        res.end();
        return;
      }

      if (url.pathname === "/api/auth/callback") {
        const cookies = req.headers.cookie ?? "";
        const code = url.searchParams.get("code");

        // Verify PKCE cookie was preserved and passed back by Relay
        if (!cookies.includes("__pkce_code_verifier=pkce_secret_hash_999")) {
          res.writeHead(400, { "content-type": "text/plain" });
          res.end("Missing required PKCE code verifier cookie");
          return;
        }

        if (code !== "google_auth_code_ok") {
          res.writeHead(401, { "content-type": "text/plain" });
          res.end("Invalid authorization code");
          return;
        }

        // Issue application session cookie and redirect to dashboard
        res.writeHead(302, {
          location: `http://localhost:${devPort}/dashboard`,
          "set-cookie":
            "app_session=auth_token_usr_abc; Domain=localhost; Path=/; HttpOnly; SameSite=Lax",
        });
        res.end();
        return;
      }

      if (url.pathname === "/dashboard") {
        const cookies = req.headers.cookie ?? "";
        if (!cookies.includes("app_session=auth_token_usr_abc")) {
          res.writeHead(401, { "content-type": "text/html" });
          res.end("<h1>Unauthorized</h1>");
          return;
        }

        res.writeHead(200, { "content-type": "text/html" });
        res.end(
          "<!doctype html><html><body><h1>Welcome to Dashboard</h1></body></html>",
        );
        return;
      }

      res.writeHead(404);
      res.end("Not Found");
    });

    await new Promise<void>((resolve) =>
      devServer.listen(devPort, "127.0.0.1", resolve),
    );

    // 2. Start Relay Gateway proxying devPort
    gateway = await startRelayGateway({
      preferredPort: gatewayPort,
      targetPort: devPort,
      sessionToken,
      host: "127.0.0.1",
    });
  });

  afterAll(async () => {
    await gateway.close();
    await new Promise<void>((resolve) => devServer.close(() => resolve()));
  });

  test("Step 1: Pairing handshake grants session cookie", async () => {
    const pairResp = await fetch(
      `http://127.0.0.1:${gateway.port}/?relay_token=${sessionToken}`,
      { redirect: "manual" },
    );

    expect(pairResp.status).toBe(302);
    const setCookie = pairResp.headers.get("set-cookie");
    expect(setCookie).toContain("__relay_session=");
    expect(setCookie).toContain(sessionToken);
  });

  test("Step 2: Relay intercepts OAuth redirect and swaps redirect_uri with bridge", async () => {
    const authResp = await fetch(
      `http://127.0.0.1:${gateway.port}/auth/google`,
      {
        headers: {
          cookie: `__relay_session=${sessionToken}`,
        },
        redirect: "manual",
      },
    );

    expect(authResp.status).toBe(302);
    const location = authResp.headers.get("location");
    expect(location).toBeDefined();
    if (!location) throw new Error("Location header is required");

    const locationUrl = new URL(location);
    expect(locationUrl.hostname).toBe("accounts.google.com");

    // Must be rewritten to point to Relay's callback endpoint
    const redirectUri = locationUrl.searchParams.get("redirect_uri");
    expect(redirectUri).toBe(
      `http://127.0.0.1:${gateway.port}/__relay/oauth/callback`,
    );

    // Preserves PKCE cookie on mobile browser
    const setCookie = authResp.headers.get("set-cookie");
    expect(setCookie).toContain("__pkce_code_verifier=pkce_secret_hash_999");
  });

  test("Step 3: Mobile client completes OAuth and hits Relay callback gateway", async () => {
    // 1. Initial auth request to register state
    const authResp = await fetch(
      `http://127.0.0.1:${gateway.port}/auth/google`,
      {
        headers: {
          cookie: `__relay_session=${sessionToken}`,
        },
        redirect: "manual",
      },
    );
    const authLocation = authResp.headers.get("location");
    expect(authLocation).toBeDefined();
    if (!authLocation) throw new Error("Location header is required");

    const location = new URL(authLocation);
    const state = location.searchParams.get("state");
    expect(state).toBeDefined();
    if (!state) throw new Error("State parameter is required");

    // 2. Mobile returns from Google to Relay callback
    const callbackResp = await fetch(
      `http://127.0.0.1:${gateway.port}/__relay/oauth/callback?code=google_auth_code_ok&state=${state}`,
      {
        headers: {
          cookie: `__relay_session=${sessionToken}; __pkce_code_verifier=pkce_secret_hash_999`,
        },
        redirect: "manual",
      },
    );

    expect(callbackResp.status).toBe(302);
    // Should be normalized to relative /dashboard path, not localhost
    expect(callbackResp.headers.get("location")).toBe("/dashboard");

    // The Set-Cookie should be re-stitched and Domain=localhost removed
    const setCookie = callbackResp.headers.get("set-cookie");
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain("app_session=auth_token_usr_abc");
    expect(setCookie).not.toContain("Domain=localhost");
  });

  test("Step 4: Authenticated mobile device navigates to protected dashboard", async () => {
    const dashboardResp = await fetch(
      `http://127.0.0.1:${gateway.port}/dashboard`,
      {
        headers: {
          cookie: `__relay_session=${sessionToken}; app_session=auth_token_usr_abc`,
        },
      },
    );

    expect(dashboardResp.status).toBe(200);
    const html = await dashboardResp.text();
    expect(html).toContain("Welcome to Dashboard");
  });

  test("Step 5: Boots with HTTPS and binds to *.lan.relay.paddy.systems", async () => {
    const httpsGateway = await startRelayGateway({
      preferredPort: 7990,
      targetPort: devPort,
      sessionToken: "tok_https_test_456",
      enableHttps: true,
      lanIp: "192.168.1.75",
      lanApexDomain: "lan.relay.paddy.systems",
    });

    expect(httpsGateway.isHttps).toBe(true);
    expect(httpsGateway.lanDomain).toBe("192-168-1-75.lan.relay.paddy.systems");

    await httpsGateway.close();
  });
});
