import { defaultSessionRegistry } from "@src/storage/session-store.js";
import { eventHandler, readBody, setResponseStatus } from "h3";

export default eventHandler(async (event) => {
  const body = await readBody<{
    targetPort?: number;
    targetHost?: string;
    ttlSeconds?: number;
    metadata?: Record<string, string>;
  }>(event);

  if (!body?.targetPort || typeof body.targetPort !== "number") {
    setResponseStatus(event, 400);
    return { error: "Missing or invalid 'targetPort' parameter." };
  }

  const session = defaultSessionRegistry.createSession({
    targetPort: body.targetPort,
    targetHost: body.targetHost,
    ttlSeconds: body.ttlSeconds,
    metadata: body.metadata,
  });

  setResponseStatus(event, 201);
  return { session };
});
