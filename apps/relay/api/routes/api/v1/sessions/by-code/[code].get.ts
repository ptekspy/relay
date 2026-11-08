import { defaultSessionRegistry } from "@src/storage/session-store.js";
import { eventHandler, getRouterParam, setResponseStatus } from "h3";

export default eventHandler((event) => {
  const codeParam = getRouterParam(event, "code");
  if (!codeParam) {
    setResponseStatus(event, 400);
    return { error: "Missing short code parameter." };
  }

  const session = defaultSessionRegistry.getSessionByShortCode(codeParam);
  if (!session) {
    setResponseStatus(event, 404);
    return { error: "No active session found matching that code." };
  }

  return { session };
});
