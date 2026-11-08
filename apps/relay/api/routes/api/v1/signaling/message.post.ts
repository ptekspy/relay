import { toSessionId } from "@paddy-systems/relay-protocol";
import {
  defaultSignalingHub,
  type SignalingMessageType,
} from "@src/signaling/webrtc.js";
import { eventHandler, readBody, setResponseStatus } from "h3";

export default eventHandler(async (event) => {
  const body = await readBody<{
    sessionId?: string;
    from?: string;
    to?: string;
    type?: SignalingMessageType;
    payload?: string;
  }>(event);

  if (
    !body?.sessionId ||
    !body.from ||
    !body.to ||
    !body.type ||
    !body.payload
  ) {
    setResponseStatus(event, 400);
    return {
      error:
        "Missing required signaling fields (sessionId, from, to, type, payload).",
    };
  }

  const message = defaultSignalingHub.postMessage({
    sessionId: toSessionId(body.sessionId),
    from: body.from,
    to: body.to,
    type: body.type,
    payload: body.payload,
  });

  setResponseStatus(event, 201);
  return { message };
});
