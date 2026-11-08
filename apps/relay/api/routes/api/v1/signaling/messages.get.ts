import { toSessionId } from "@paddy-systems/relay-protocol";
import { defaultSignalingHub } from "@src/signaling/webrtc.js";
import { eventHandler, getQuery, setResponseStatus } from "h3";

export default eventHandler((event) => {
  const query = getQuery(event);
  const sessionId = query.sessionId
    ? toSessionId(String(query.sessionId))
    : undefined;
  const recipientId = query.recipientId ? String(query.recipientId) : undefined;

  if (!sessionId || !recipientId) {
    setResponseStatus(event, 400);
    return {
      error: "Missing required query parameters: sessionId and recipientId.",
    };
  }

  const messages = defaultSignalingHub.consumeMessages(sessionId, recipientId);
  return { messages };
});
