import { createServer } from "node:http";
import { GraphQLRelayAdapter } from "@paddy-systems/relay-integrations";
import { createSchema, createYoga } from "graphql-yoga";

export function buildYogaServer() {
  const adapter = new GraphQLRelayAdapter();

  const schema = createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        hello: String!
        health: HealthStatus!
      }
      type HealthStatus {
        status: String!
        graphql: Boolean!
      }
    `,
    resolvers: {
      Query: {
        hello: () => "Hello from GraphQL Yoga over Relay!",
        health: () => ({ status: "ok", graphql: true }),
      },
    },
  });

  const yoga = createYoga({
    schema,
    graphqlEndpoint: "/graphql",
    graphiql: adapter.createGraphiQLConfig(),
  });

  const server = createServer((req, res) => {
    if (req.url === "/" && req.method === "GET") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok", framework: "graphql-yoga" }));
      return;
    }
    if (req.url === "/api/test-echo" && req.method === "POST") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ echoed: true, service: "graphql-yoga" }));
      return;
    }
    yoga(req, res);
  });

  return server;
}
