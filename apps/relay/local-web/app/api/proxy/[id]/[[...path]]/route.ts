import { type NextRequest, NextResponse } from "next/server";

const DEFAULT_GATEWAY_HOST = "127.0.0.1";
const DEFAULT_GATEWAY_PORT = "7331";

export async function handleProxy(
  request: NextRequest,
  context: { params: Promise<{ id: string; path?: string[] }> },
) {
  const { id, path } = await context.params;
  const url = new URL(request.url);

  // Determine gateway port & host
  const gatewayPort =
    url.searchParams.get("gateway") ||
    process.env.RELAY_GATEWAY_PORT ||
    DEFAULT_GATEWAY_PORT;
  const gatewayHost = process.env.RELAY_GATEWAY_HOST || DEFAULT_GATEWAY_HOST;
  const gatewayBase = `http://${gatewayHost}:${gatewayPort}`;

  // Reconstruct path and query
  const subpath = path && path.length > 0 ? path.join("/") : "";
  const upstreamUrl = new URL(`/${subpath}`, gatewayBase);
  url.searchParams.forEach((val, key) => {
    upstreamUrl.searchParams.set(key, val);
  });

  // Handle token authentication
  const token =
    url.searchParams.get("token") || request.cookies.get("relay_token")?.value;

  // Clone headers
  const forwardHeaders = new Headers();
  request.headers.forEach((val, key) => {
    if (
      key.toLowerCase() !== "host" &&
      key.toLowerCase() !== "connection" &&
      key.toLowerCase() !== "content-length"
    ) {
      forwardHeaders.set(key, val);
    }
  });

  if (token && !forwardHeaders.get("cookie")?.includes("relay_token")) {
    const existingCookie = forwardHeaders.get("cookie") || "";
    forwardHeaders.set(
      "cookie",
      existingCookie
        ? `${existingCookie}; relay_token=${token}`
        : `relay_token=${token}`,
    );
  }

  // Handle body
  let body: ArrayBuffer | undefined;
  if (["POST", "PUT", "PATCH"].includes(request.method)) {
    body = await request.arrayBuffer();
  }

  try {
    const upstreamRes = await fetch(upstreamUrl.toString(), {
      method: request.method,
      headers: forwardHeaders,
      body,
      redirect: "manual",
    });

    const responseHeaders = new Headers();
    upstreamRes.headers.forEach((val, key) => {
      if (
        key.toLowerCase() !== "content-encoding" &&
        key.toLowerCase() !== "content-length"
      ) {
        responseHeaders.set(key, val);
      }
    });

    // Check if HTML needs <base> tag injection
    const contentType = upstreamRes.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      let html = await upstreamRes.text();
      const baseTag = `<base href="/api/proxy/${id}/">`;

      if (html.includes("<head>")) {
        html = html.replace("<head>", `<head>${baseTag}`);
      } else if (html.includes("<head ")) {
        html = html.replace(/<head([^>]*)>/, `<head$1>${baseTag}`);
      } else {
        html = `${baseTag}${html}`;
      }

      return new NextResponse(html, {
        status: upstreamRes.status,
        headers: responseHeaders,
      });
    }

    const responseData = await upstreamRes.arrayBuffer();
    return new NextResponse(responseData, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to connect to Relay Gateway",
        gatewayUrl: gatewayBase,
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
export const PATCH = handleProxy;
export const OPTIONS = handleProxy;
export const HEAD = handleProxy;
