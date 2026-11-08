/**
 * GraphQL Yoga & Apollo Relay Integration
 *
 * Configures GraphiQL playground routing, schema introspection,
 * and GraphQL over WebSocket (graphql-transport-ws) protocol forwarding.
 *
 * Note for Octavia: This enables GraphQL endpoints and subscriptions to be tunneled via Relay.
 */

export interface RelayGraphQLOptions {
  relayHost?: string;
  endpoint?: string;
}

export class GraphQLRelayAdapter {
  private readonly relayHost: string;
  private readonly endpoint: string;

  constructor(options: RelayGraphQLOptions = {}) {
    this.relayHost = options.relayHost ?? "127.0.0.1:7331";
    this.endpoint = options.endpoint ?? "/graphql";
  }

  public getEndpoint(): string {
    return this.endpoint;
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

  public createGraphiQLConfig() {
    return {
      title: "Relay GraphiQL Playground",
      endpoint: this.endpoint,
      subscriptionsEndpoint: this.endpoint,
    };
  }
}
