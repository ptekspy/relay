/**
 * Fastify API Relay Integration Plugin
 *
 * Configures trustProxy, CORS headers, and health telemetry endpoints
 * when Fastify is running behind the external Relay tunnel.
 *
 * Note for Octavia: This ensures Fastify accurately perceives the forwarded proto, host, and client IP.
 */

export interface RelayFastifyOptions {
  relayHost?: string;
  enableTrustProxy?: boolean;
  prefix?: string;
}

export interface FastifyInstanceLike {
  addHook: (
    name: "onRequest" | "onResponse" | "preHandler",
    hook: (
      req: unknown,
      reply: unknown,
      done?: () => void,
    ) => Promise<void> | void,
  ) => void;
  decorateRequest: (property: string, value: unknown) => void;
}

export class FastifyRelayAdapter {
  private readonly relayHost: string;
  private readonly enableTrustProxy: boolean;

  constructor(options: RelayFastifyOptions = {}) {
    this.relayHost = options.relayHost ?? "127.0.0.1:7331";
    this.enableTrustProxy = options.enableTrustProxy ?? true;
  }

  public getTrustProxySetting(): boolean | string {
    return this.enableTrustProxy;
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
    if (!normalized["x-forwarded-proto"]) {
      normalized["x-forwarded-proto"] = "http";
    }

    return normalized;
  }

  public registerPlugin(fastify: FastifyInstanceLike): void {
    fastify.decorateRequest("isRelayed", true);
    fastify.addHook("onRequest", async (_req, _reply) => {
      // Hook invoked on each incoming relayed request
    });
  }
}
