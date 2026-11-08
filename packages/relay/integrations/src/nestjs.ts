/**
 * NestJS Enterprise Microservice Relay Integration
 *
 * Provides NestJS interceptors and middleware to adapt OpenAPI/Swagger
 * spec URLs, preserve client IP behind reverse proxy, and expose telemetry.
 *
 * Note for Octavia: This enables NestJS modular architectures to be accessed through Relay.
 */

export interface RelayNestOptions {
  relayHost?: string;
  swaggerPath?: string;
}

export interface NestRequestLike {
  headers: Record<string, string | string[] | undefined>;
  url: string;
  method: string;
  body?: unknown;
}

export class NestJsRelayAdapter {
  private readonly relayHost: string;
  private readonly swaggerPath: string;

  constructor(options: RelayNestOptions = {}) {
    this.relayHost = options.relayHost ?? "127.0.0.1:7331";
    this.swaggerPath = options.swaggerPath ?? "/api/docs";
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

  public rewriteSwaggerSpec(
    spec: Record<string, unknown>,
  ): Record<string, unknown> {
    return {
      ...spec,
      servers: [
        {
          url: `http://${this.relayHost}`,
          description: "Relay Tunnel Gateway",
        },
      ],
    };
  }
}
