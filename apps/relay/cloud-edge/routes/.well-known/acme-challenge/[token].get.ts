import { AcmeTlsManager } from "@src/acme-tls";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";

// Singleton ACME manager instance for the edge node
export const edgeTlsManager = new AcmeTlsManager();

export default defineEventHandler((event) => {
  const token = getRouterParam(event, "token");
  if (!token) {
    setResponseStatus(event, 400);
    return "Missing ACME challenge token";
  }

  const keyAuth = edgeTlsManager.getChallenge(token);
  if (!keyAuth) {
    setResponseStatus(event, 404);
    return "ACME challenge not found or expired";
  }

  return keyAuth;
});
