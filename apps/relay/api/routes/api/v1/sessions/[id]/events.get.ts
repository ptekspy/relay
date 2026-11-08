import { toSessionId } from "@paddy-systems/relay-protocol";
import { defaultSessionRegistry } from "@src/storage/session-store.js";
import {
  createEventStream,
  eventHandler,
  getRouterParam,
  setResponseStatus,
} from "h3";

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

  const eventStream = createEventStream(event);

  // Send initial session snapshot event
  eventStream.push(JSON.stringify({ type: "SESSION_STATE", session }));

  // Keep alive timer
  const interval = setInterval(async () => {
    const current = defaultSessionRegistry.getSession(toSessionId(idParam));
    if (current?.status !== "active") {
      eventStream.push(JSON.stringify({ type: "SESSION_TERMINATED" }));
      clearInterval(interval);
      await eventStream.close();
    } else {
      eventStream.push(
        JSON.stringify({ type: "HEARTBEAT", expiresAt: current.expiresAt }),
      );
    }
  }, 10000);

  eventStream.onClosed(() => {
    clearInterval(interval);
  });

  return eventStream.send();
});
