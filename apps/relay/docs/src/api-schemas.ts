export class RelayApiSchemaProvider {
  public getOpenApiSchema(): Record<string, unknown> {
    return {
      openapi: "3.1.0",
      info: {
        title: "Relay Cloud Edge Gateway API",
        version: "1.0.0",
        description:
          "Public HTTP REST API for Relay session discovery and edge tunnel provisioning.",
      },
      paths: {
        "/api/v1/sessions": {
          post: {
            summary: "Create ephemeral session tunnel",
            responses: {
              "201": {
                description:
                  "Session allocated with short code and WebSocket endpoint",
              },
            },
          },
        },
        "/api/v1/health": {
          get: {
            summary: "Health probe for load balancer ingress",
            responses: {
              "200": {
                description: "Edge node healthy",
              },
            },
          },
        },
      },
    };
  }

  public getAsyncApiSchema(): Record<string, unknown> {
    return {
      asyncapi: "3.0.0",
      info: {
        title: "Relay WebSocket Telemetry Signaling API",
        version: "1.0.0",
        description:
          "Real-time bi-directional WebSocket protocol between host and mobile receivers.",
      },
      channels: {
        "relay.session.{sessionId}": {
          address: "relay.session.{sessionId}",
          messages: {
            domMutation: {
              summary: "DOM mutation batch broadcast",
            },
            consoleLog: {
              summary: "Console stream broadcast",
            },
          },
        },
      },
    };
  }
}

export const relayApiSchemaProvider = new RelayApiSchemaProvider();
