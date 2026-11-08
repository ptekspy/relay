import type { EventHandler } from "h3";

export type ApiIdentity = {
  name: string;
  version: string;
};

export function createHealthHandler(identity: ApiIdentity): EventHandler {
  return () => ({
    status: "ok",
    service: identity.name,
    version: identity.version,
  });
}

export function createReadyHandler(identity: ApiIdentity): EventHandler {
  return () => ({
    status: "ready",
    service: identity.name,
    version: identity.version,
  });
}
