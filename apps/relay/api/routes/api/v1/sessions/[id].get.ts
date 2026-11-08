import { toSessionId } from "@paddy-systems/relay-protocol";
import { defaultSessionRegistry } from "@src/storage/session-store.js";
import { eventHandler, getRouterParam, setResponseStatus } from "h3";

export default eventHandler((event) => {
  const idParam = getRouterParam(event, "id");
  if (!idParam) {
    setResponseStatus(event, 400);
    return { error: "Missing session ID." };
  }

  const session = defaultSessionRegistry.getSession(toSessionId(idParam));
  if (!session) {
    setResponseStatus(event, 404);
    return { error: "Session not found." };
  }

  return { session };
});
