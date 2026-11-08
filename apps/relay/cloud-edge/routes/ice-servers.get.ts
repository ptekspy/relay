import { TurnCredentialProvider } from "@src/turn-credentials";
import { defineEventHandler, getQuery } from "h3";

const provider = new TurnCredentialProvider();

export default defineEventHandler((event) => {
  const query = getQuery(event);
  const userId =
    typeof query.userId === "string" ? query.userId : "anonymous-receiver";
  const ttl =
    typeof query.ttl === "string" ? Number.parseInt(query.ttl, 10) : undefined;

  return provider.mintCredentials(userId, ttl);
});
