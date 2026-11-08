import {
  createServer,
  request as httpRequest,
  type IncomingHttpHeaders,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import { createServer as createHttpsServer } from "node:https";
import { connect as netConnect, type Socket } from "node:net";
import {
  toReceiverId,
  verifyTimingSafeToken,
} from "@paddy-systems/relay-protocol";
import {
  generateClientRecorderScript,
  type RecordedEvent,
  type SessionComment,
} from "@paddy-systems/relay-recording";
import {
  DEFAULT_LAN_APEX_DOMAIN,
  ipToLanDomain,
  oauthStateBridge,
} from "@paddy-systems/relay-security";
import { findProcessOnPort, terminateProcess } from "./firewall.js";
import { SlidingWindowRateLimiter } from "./rate-limiter.js";
import { ReceiverConnectionPool } from "./receiver-pool.js";
import { getOrProvisionLanCertificate } from "./tls-certs.js";

export const DEFAULT_RELAY_GATEWAY_PORT = 7331;
export const RELAY_COOKIE_NAME = "__relay_session";
export const RELAY_TOKEN_QUERY = "relay_token";

export interface RelayGateway {
  port: number;
  sessionToken: string;
  displacedFromPreferred?: number;
  receiverPool: ReceiverConnectionPool;
  isHttps: boolean;
  lanDomain?: string;
  close(): Promise<void>;
  getRecordedEvents(): RecordedEvent[];
  getComments(): SessionComment[];
  addComment(comment: Omit<SessionComment, "id" | "createdAt">): SessionComment;
}

export interface RelayGatewayOptions {
  preferredPort?: number;
  targetPort: number;
  sessionToken: string;
  host?: string;
  enableHttps?: boolean;
  lanIp?: string;
  lanApexDomain?: string;
  onClientConnected?: (ip: string, userAgent?: string) => void;
  onCommentReceived?: (comment: SessionComment) => void;
  receiverPool?: ReceiverConnectionPool;
  maxRequestsPerMinute?: number;
  enableRecording?: boolean;
}

function tokensMatch(candidate: string | undefined, expected: string): boolean {
  if (!candidate) return false;
  return verifyTimingSafeToken(candidate, expected);
}

function getCookie(
  cookieHeader: string | undefined,
  name: string,
): string | undefined {
  if (!cookieHeader) return undefined;
  for (const cookie of cookieHeader.split(";")) {
    const idx = cookie.indexOf("=");
    if (idx === -1) continue;
    if (cookie.slice(0, idx).trim() === name) {
      return cookie.slice(idx + 1).trim();
    }
  }
  return undefined;
}

function stripRelayCookie(
  cookieHeader: string | undefined,
): string | undefined {
  if (!cookieHeader) return undefined;
  const filtered = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .filter((c) => {
      const idx = c.indexOf("=");
      if (idx === -1) return true;
      return c.slice(0, idx).trim() !== RELAY_COOKIE_NAME;
    });
  return filtered.length > 0 ? filtered.join("; ") : undefined;
}

function createUpstreamHeaders(
  request: IncomingMessage,
  targetPort: number,
): IncomingHttpHeaders {
  const headers = { ...request.headers };
  const cookie = stripRelayCookie(request.headers.cookie);

  if (cookie) {
    headers.cookie = cookie;
  } else {
    delete headers.cookie;
  }

  // Disable upstream compression so HTML responses can be instrumented
  delete headers["accept-encoding"];

  const pathname = new URL(request.url ?? "/", "http://relay.local").pathname;

  // Framework HMR and font header normalisation
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/@vite/") ||
    pathname.startsWith("/@fs/") ||
    pathname.startsWith("/node_modules/")
  ) {
    headers.host = `localhost:${targetPort}`;
  }

  if (
    pathname === "/_next/hmr" ||
    pathname.startsWith("/_next/__nextjs_font") ||
    pathname.includes("vite-hmr") ||
    pathname.startsWith("/@vite")
  ) {
    headers.origin = `http://localhost:${targetPort}`;
    headers.host = `localhost:${targetPort}`;
  }

  return headers;
}

function createUpstreamUpgradeHeaders(
  request: IncomingMessage,
  targetPort: number,
): IncomingHttpHeaders {
  const headers = createUpstreamHeaders(request, targetPort);
  const url = new URL(request.url ?? "/", "http://relay.local");

  // Protect Next.js / Vite / Webpack / Turbopack HMR endpoints
  if (
    url.pathname === "/_next/hmr" ||
    url.pathname === "/_next/webpack-hmr" ||
    url.pathname === "/ws" ||
    url.pathname.includes("hmr") ||
    url.pathname.includes("vite-hmr") ||
    url.pathname.includes("turbopack")
  ) {
    headers.origin = `http://localhost:${targetPort}`;
    headers.host = `localhost:${targetPort}`;
  }

  return headers;
}

function proxyHttpRequest(
  request: IncomingMessage,
  response: ServerResponse,
  targetPort: number,
  isHttps = false,
): void {
  const upstream = httpRequest(
    {
      hostname: "127.0.0.1",
      port: targetPort,
      method: request.method,
      path: request.url,
      headers: createUpstreamHeaders(request, targetPort),
    },
    (upstreamResponse) => {
      const statusCode = upstreamResponse.statusCode ?? 200;
      const location = upstreamResponse.headers.location;

      // Intercept and rewrite OAuth Provider Authorization Redirects
      if (
        (statusCode === 301 ||
          statusCode === 302 ||
          statusCode === 303 ||
          statusCode === 307 ||
          statusCode === 308) &&
        typeof location === "string" &&
        oauthStateBridge.isOAuthAuthorizationUrl(location)
      ) {
        const protocol = isHttps ? "https" : "http";
        const clientHost = request.headers.host || `127.0.0.1:${targetPort}`;
        const callbackUrl = `${protocol}://${clientHost}/__relay/oauth/callback`;
        const { rewrittenUrl } = oauthStateBridge.rewriteOAuthAuthorizationUrl(
          location,
          callbackUrl,
          `${protocol}://${clientHost}`,
        );

        const responseHeaders = {
          ...upstreamResponse.headers,
          location: rewrittenUrl,
        };
        response.writeHead(
          statusCode,
          upstreamResponse.statusMessage,
          responseHeaders,
        );
        upstreamResponse.pipe(response);
        return;
      }

      const contentType = upstreamResponse.headers["content-type"] ?? "";
      const isHtml =
        typeof contentType === "string" && contentType.includes("text/html");

      if (isHtml) {
        const chunks: Buffer[] = [];
        upstreamResponse.on("data", (chunk: Buffer) => chunks.push(chunk));
        upstreamResponse.on("end", () => {
          let html = Buffer.concat(chunks).toString("utf-8");
          const injection = '<script src="/__relay/recorder.js"></script>';
          if (html.includes("</body>")) {
            html = html.replace("</body>", `${injection}</body>`);
          } else if (html.includes("</head>")) {
            html = html.replace("</head>", `${injection}</head>`);
          } else {
            html += injection;
          }

          const responseHeaders = { ...upstreamResponse.headers };
          delete responseHeaders["content-length"];
          delete responseHeaders["transfer-encoding"];
          responseHeaders["content-length"] = Buffer.byteLength(
            html,
            "utf-8",
          ).toString();

          response.writeHead(
            upstreamResponse.statusCode ?? 200,
            upstreamResponse.statusMessage,
            responseHeaders,
          );
          response.end(html);
        });
        return;
      }

      response.writeHead(
        upstreamResponse.statusCode ?? 502,
        upstreamResponse.statusMessage,
        upstreamResponse.headers,
      );
      upstreamResponse.pipe(response);
    },
  );

  upstream.on("error", () => {
    if (!response.headersSent) {
      response.writeHead(502, {
        "cache-control": "no-store",
        "content-type": "text/html; charset=utf-8",
      });
    }

    response.end(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Relay Target Unavailable</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0a0a0a; color: #ededed; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }
    .card { background: #171717; border: 1px solid #2e2e2e; border-radius: 12px; padding: 2rem; max-width: 480px; width: 100%; box-shadow: 0 8px 30px rgba(0,0,0,0.5); }
    h1 { font-size: 1.25rem; margin: 0 0 0.5rem 0; color: #ff5c5c; }
    p { font-size: 0.9rem; color: #a1a1aa; line-height: 1.5; margin: 0.5rem 0; }
    code { background: #27272a; padding: 2px 6px; border-radius: 4px; color: #38bdf8; font-size: 0.85em; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Service Unavailable</h1>
    <p>Relay Gateway is active, but your local development server on port <code>${targetPort}</code> is not responding.</p>
    <p>Ensure your application server is running and try refreshing this page.</p>
  </div>
</body>
</html>`);
  });

  request.pipe(upstream);
}

export async function startRelayGateway(
  options: RelayGatewayOptions,
): Promise<RelayGateway> {
  const {
    targetPort,
    sessionToken,
    preferredPort = DEFAULT_RELAY_GATEWAY_PORT,
    onClientConnected,
    receiverPool = new ReceiverConnectionPool(),
    maxRequestsPerMinute = 30,
  } = options;

  const rateLimiter = new SlidingWindowRateLimiter({
    windowMs: 60000,
    maxRequests: maxRequestsPerMinute,
  });

  let activePort = preferredPort;
  let displacedFrom: number | undefined;

  // Check if preferred port is held by a stale process and attempt reclamation
  const occupying = await findProcessOnPort(preferredPort);
  if (occupying) {
    const isStaleRunner =
      occupying.command.includes("node") ||
      occupying.command.includes("bun") ||
      occupying.command.includes("relay");

    if (isStaleRunner) {
      await terminateProcess(occupying.pid);
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  const recordedEvents: RecordedEvent[] = [];
  const comments: SessionComment[] = [];
  const sessionStartTime = Date.now();

  let isHttps = false;
  let lanDomain: string | undefined;

  const requestListener = (
    request: IncomingMessage,
    response: ServerResponse,
  ) => {
    const rawUrl = request.url ?? "/";
    const parsedUrl = new URL(rawUrl, "http://relay.local");
    const queryToken = parsedUrl.searchParams.get(RELAY_TOKEN_QUERY);
    const cookieToken = getCookie(request.headers.cookie, RELAY_COOKIE_NAME);
    const clientIp = request.socket.remoteAddress ?? "unknown";

    const isAuthed =
      (queryToken && tokensMatch(queryToken, sessionToken)) ||
      (cookieToken && tokensMatch(cookieToken, sessionToken));

    // Rate limiting on unauthenticated handshake / requests
    if (!isAuthed) {
      if (!rateLimiter.isAllowed(clientIp)) {
        response.writeHead(429, {
          "cache-control": "no-store",
          "content-type": "text/html; charset=utf-8",
          "retry-after": "60",
        });
        response.end(`<!doctype html>
<html lang="en">
<head><title>429 Too Many Requests</title></head>
<body><h1>Too Many Requests</h1><p>Rate limit exceeded for unauthenticated pairing requests.</p></body>
</html>`);
        return;
      }
    }

    // Initial QR code token check
    if (queryToken && tokensMatch(queryToken, sessionToken)) {
      const userAgent = request.headers["user-agent"] ?? "unknown";
      onClientConnected?.(clientIp, userAgent);

      const receiverId = toReceiverId(
        `rec_${clientIp.replace(/[^a-zA-Z0-9]/g, "_")}`,
      );
      receiverPool.register({
        id: receiverId,
        ip: clientIp,
        userAgent,
        connectedAt: Date.now(),
        lastActiveAt: Date.now(),
      });

      // Clean token out of visible URL and set secure session cookie
      parsedUrl.searchParams.delete(RELAY_TOKEN_QUERY);
      const cleanPath =
        `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}` || "/";

      response.writeHead(302, {
        "cache-control": "no-store",
        location: cleanPath,
        "set-cookie": `${RELAY_COOKIE_NAME}=${sessionToken}; HttpOnly; SameSite=Lax; Path=/`,
      });
      response.end();
      return;
    }

    // Cookie authentication check
    if (!tokensMatch(cookieToken, sessionToken)) {
      response.writeHead(401, {
        "cache-control": "no-store",
        "content-type": "text/html; charset=utf-8",
      });
      response.end(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Relay Pairing Required</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #09090b; color: #fafafa; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }
    .card { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 2rem; max-width: 440px; width: 100%; text-align: center; }
    h1 { font-size: 1.25rem; margin-bottom: 0.5rem; }
    p { font-size: 0.9rem; color: #a1a1aa; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Pairing Required</h1>
    <p>This Relay session is protected. Please scan the QR code displayed in your terminal to connect your device.</p>
  </div>
</body>
</html>`);
      return;
    }

    // Update receiver activity
    const receiverId = toReceiverId(
      `rec_${clientIp.replace(/[^a-zA-Z0-9]/g, "_")}`,
    );
    receiverPool.touch(receiverId);

    // Relay Injected Recorder Script
    if (parsedUrl.pathname === "/__relay/recorder.js") {
      const script = generateClientRecorderScript({
        sessionId: sessionToken,
        enableFeedbackOverlay: true,
      });
      response.writeHead(200, {
        "content-type": "application/javascript; charset=utf-8",
        "cache-control": "no-store",
      });
      response.end(script);
      return;
    }

    // Telemetry and Event Stream Ingestion
    if (parsedUrl.pathname === "/__relay/record" && request.method === "POST") {
      let body = "";
      request.on("data", (chunk) => {
        body += chunk;
      });
      request.on("end", () => {
        try {
          const data = JSON.parse(body);
          if (Array.isArray(data.events)) {
            recordedEvents.push(...data.events);
          }
          response.writeHead(200, {
            "content-type": "application/json",
            "cache-control": "no-store",
          });
          response.end(
            JSON.stringify({ ok: true, count: recordedEvents.length }),
          );
        } catch {
          response.writeHead(400, { "content-type": "application/json" });
          response.end(JSON.stringify({ error: "Invalid JSON" }));
        }
      });
      return;
    }

    // In-Context Feedback Comments
    if (parsedUrl.pathname === "/__relay/comments") {
      if (request.method === "POST") {
        let body = "";
        request.on("data", (chunk) => {
          body += chunk;
        });
        request.on("end", () => {
          try {
            const rawComment = JSON.parse(body);

            // Handle reply action
            if (rawComment.action === "reply" && rawComment.commentId) {
              const target = comments.find(
                (c) => c.id === rawComment.commentId,
              );
              if (!target) {
                response.writeHead(404, { "content-type": "application/json" });
                response.end(JSON.stringify({ error: "Comment not found" }));
                return;
              }
              if (!target.replies) target.replies = [];
              const reply = {
                id: `rpl_${Math.random().toString(36).slice(2, 10)}`,
                commentId: target.id,
                author: rawComment.author || {
                  name: "Host Developer",
                  isHost: true,
                },
                content: rawComment.content || "",
                createdAt: Date.now(),
              };
              target.replies.push(reply);

              response.writeHead(200, {
                "content-type": "application/json",
                "cache-control": "no-store",
              });
              response.end(
                JSON.stringify({ ok: true, reply, comment: target }),
              );
              return;
            }

            // Handle archive action
            if (rawComment.action === "archive" && rawComment.commentId) {
              const target = comments.find(
                (c) => c.id === rawComment.commentId,
              );
              if (!target) {
                response.writeHead(404, { "content-type": "application/json" });
                response.end(JSON.stringify({ error: "Comment not found" }));
                return;
              }
              target.archived = true;
              target.archivedAtTimestampMs =
                typeof rawComment.archivedAtTimestampMs === "number"
                  ? rawComment.archivedAtTimestampMs
                  : Math.max(0, Date.now() - sessionStartTime);

              response.writeHead(200, {
                "content-type": "application/json",
                "cache-control": "no-store",
              });
              response.end(JSON.stringify({ ok: true, comment: target }));
              return;
            }

            const newComment: SessionComment = {
              id:
                rawComment.id ||
                `cmt_${Math.random().toString(36).slice(2, 10)}`,
              sessionId: sessionToken,
              timestampMs:
                typeof rawComment.timestampMs === "number"
                  ? rawComment.timestampMs
                  : Math.max(0, Date.now() - sessionStartTime),
              position: rawComment.position || { xPercent: 50, yPercent: 50 },
              targetSelector: rawComment.targetSelector,
              routeUrl: rawComment.routeUrl || "/",
              viewport: rawComment.viewport,
              author: rawComment.author || { name: "Device Tester" },
              content: rawComment.content || "",
              resolved: false,
              archived: false,
              replies: [],
              createdAt: Date.now(),
            };
            comments.push(newComment);
            options.onCommentReceived?.(newComment);

            response.writeHead(200, {
              "content-type": "application/json",
              "cache-control": "no-store",
            });
            response.end(JSON.stringify({ ok: true, comment: newComment }));
          } catch {
            response.writeHead(400, { "content-type": "application/json" });
            response.end(JSON.stringify({ error: "Invalid comment JSON" }));
          }
        });
        return;
      }

      if (request.method === "GET") {
        response.writeHead(200, {
          "content-type": "application/json",
          "cache-control": "no-store",
        });
        response.end(JSON.stringify(comments));
        return;
      }
    }

    // Full Session Recording Export
    if (
      parsedUrl.pathname === "/__relay/recording" &&
      request.method === "GET"
    ) {
      response.writeHead(200, {
        "content-type": "application/json",
        "cache-control": "no-store",
      });
      response.end(
        JSON.stringify({
          sessionId: sessionToken,
          durationMs: Math.max(0, Date.now() - sessionStartTime),
          eventCount: recordedEvents.length,
          events: recordedEvents,
          comments,
        }),
      );
      return;
    }

    // OAuth 2.0 Loopback Callback Handler
    if (parsedUrl.pathname === "/__relay/oauth/callback") {
      const state = parsedUrl.searchParams.get("state") || "";

      if (!state) {
        response.writeHead(400, {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
        });
        response.end(
          "<!doctype html><html><body><h1>OAuth Callback Error</h1><p>Missing state parameter.</p></body></html>",
        );
        return;
      }

      const stateRecord = oauthStateBridge.consumeState(state);
      if (!stateRecord) {
        response.writeHead(400, {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
        });
        response.end(
          "<!doctype html><html><body><h1>OAuth Callback Error</h1><p>Expired or unrecognized OAuth state.</p></body></html>",
        );
        return;
      }

      const queryParams: Record<string, string> = {};
      for (const [key, val] of parsedUrl.searchParams.entries()) {
        queryParams[key] = val;
      }

      oauthStateBridge
        .forwardCallbackToUpstream({
          originalRedirectUri: stateRecord.originalRedirectUri,
          queryParams,
          incomingCookies: request.headers.cookie,
          targetPort,
          userAgent: request.headers["user-agent"],
        })
        .then((forwardResult) => {
          const clientHost = request.headers.host?.split(":")[0];
          const reStitchedCookies = forwardResult.setCookieHeaders.map((c) =>
            oauthStateBridge.rewriteSetCookie(c, clientHost),
          );

          const redirectHeaders: Record<string, string | string[]> = {
            location: forwardResult.location || "/",
            "cache-control": "no-store",
          };
          if (reStitchedCookies.length > 0) {
            redirectHeaders["set-cookie"] = reStitchedCookies;
          }

          response.writeHead(forwardResult.statusCode, redirectHeaders);
          response.end();
        })
        .catch((err) => {
          response.writeHead(502, { "content-type": "text/plain" });
          response.end(`OAuth Callback Forwarding Failed: ${err.message}`);
        });
      return;
    }

    // Authenticated: forward request to target dev server
    proxyHttpRequest(request, response, targetPort, isHttps);
  };

  let server: Server;
  if (options.enableHttps) {
    const lanIp = options.lanIp || options.host || "127.0.0.1";
    const apexDomain = options.lanApexDomain || DEFAULT_LAN_APEX_DOMAIN;
    lanDomain = ipToLanDomain(lanIp, apexDomain);

    const tlsBundle = await getOrProvisionLanCertificate(lanIp, apexDomain);
    server = createHttpsServer(
      {
        key: tlsBundle.key,
        cert: tlsBundle.cert,
      },
      requestListener,
    ) as unknown as Server;
    isHttps = true;
  } else {
    server = createServer(requestListener);
  }

  // Handle WebSocket upgrades (for HMR, Vite, Next.js, etc.)
  server.on("upgrade", (request, socket: Socket, head) => {
    const cookieToken = getCookie(request.headers.cookie, RELAY_COOKIE_NAME);
    if (!tokensMatch(cookieToken, sessionToken)) {
      socket.write(
        "HTTP/1.1 401 Unauthorized\r\nConnection: close\r\nContent-Length: 0\r\n\r\n",
      );
      socket.destroy();
      return;
    }

    const clientIp = request.socket.remoteAddress ?? "unknown";
    const receiverId = toReceiverId(
      `rec_${clientIp.replace(/[^a-zA-Z0-9]/g, "_")}`,
    );
    receiverPool.touch(receiverId);

    const upstream = netConnect(targetPort, "127.0.0.1");

    upstream.once("connect", () => {
      const requestLine = `${request.method} ${request.url} HTTP/${request.httpVersion}\r\n`;
      const headers = createUpstreamUpgradeHeaders(request, targetPort);

      const headerLines = Object.entries(headers)
        .flatMap(([name, value]) => {
          if (value === undefined) return [];
          if (Array.isArray(value)) return value.map((v) => `${name}: ${v}`);
          return [`${name}: ${value}`];
        })
        .join("\r\n");

      upstream.write(`${requestLine}${headerLines}\r\n\r\n`);
      if (head.length > 0) upstream.write(head);
      socket.pipe(upstream).pipe(socket);
    });

    upstream.on("error", () => socket.destroy());
    socket.on("error", () => upstream.destroy());
  });

  // Attempt binding with fallback if preferred port is busy
  await new Promise<void>((resolve, reject) => {
    function tryListen(port: number) {
      server.once("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE" && port < preferredPort + 20) {
          displacedFrom = preferredPort;
          tryListen(port + 1);
        } else {
          reject(err);
        }
      });

      server.listen(port, "0.0.0.0", () => {
        activePort = port;
        resolve();
      });
    }

    tryListen(preferredPort);
  });

  return {
    port: activePort,
    sessionToken,
    displacedFromPreferred: displacedFrom,
    receiverPool,
    isHttps,
    lanDomain,
    getRecordedEvents: () => [...recordedEvents],
    getComments: () => [...comments],
    addComment: (comment: Omit<SessionComment, "id" | "createdAt">) => {
      const fullComment: SessionComment = {
        ...comment,
        id: `cmt_${Math.random().toString(36).slice(2, 10)}`,
        createdAt: Date.now(),
        resolved: false,
      };
      comments.push(fullComment);
      options.onCommentReceived?.(fullComment);
      return fullComment;
    },
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    },
  };
}
