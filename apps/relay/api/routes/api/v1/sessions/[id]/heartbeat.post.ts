import { toSessionId } from "@paddy-systems/relay-protocol";
import { defaultSessionRegistry } from "@src/storage/session-store.js";
import { eventHandler, getRouterParam, readBody, setResponseStatus } from "h3";

export default eventHandler(async (event) => {
  const idParam = getRouterParam(event, "id");
  if (!idParam) {
    setResponseStatus(event, 400);
    return { error: "Missing session ID." };
  }

  const rawBody = (await readBody(event).catch(() => ({}))) as {
    ttlExtensionSeconds?: number;
  } | null;
  const sessionId = toSessionId(idParam);
  const updated = defaultSessionRegistry.updateHeartbeat(
    sessionId,
    rawBody?.ttlExtensionSeconds ?? 300,
  );

  if (!updated) {
    setResponseStatus(event, 404);
    return { error: "Session not found or already closed." };
  }

  const session = defaultSessionRegistry.getSession(sessionId);
  return { ok: true, expiresAt: session?.expiresAt };
});
