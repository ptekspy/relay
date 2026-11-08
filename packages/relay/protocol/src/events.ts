export type ConsoleLogLevel = "log" | "info" | "warn" | "error" | "debug";

export interface ConsoleEvent {
  kind: "console";
  level: ConsoleLogLevel;
  args: string[];
  timestamp: number;
}

export interface DomMutationEvent {
  kind: "dom_mutation";
  addedNodesCount: number;
  removedNodesCount: number;
  targetSelector: string;
  timestamp: number;
}

export interface NetworkTelemetryEvent {
  kind: "network";
  method: string;
  url: string;
  status: number;
  durationMs: number;
  sizeBytes?: number;
  error?: string;
  timestamp: number;
}

export interface TouchEventCoordinate {
  identifier: number;
  clientX: number;
  clientY: number;
}

export interface TouchTelemetryEvent {
  kind: "touch";
  type: "touchstart" | "touchmove" | "touchend" | "touchcancel";
  touches: TouchEventCoordinate[];
  timestamp: number;
}

export interface ViewportResizeEvent {
  kind: "viewport_resize";
  width: number;
  height: number;
  devicePixelRatio: number;
  orientation: "portrait" | "landscape";
  timestamp: number;
}

export type RelayTelemetryEvent =
  | ConsoleEvent
  | DomMutationEvent
  | NetworkTelemetryEvent
  | TouchTelemetryEvent
  | ViewportResizeEvent;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function serializeTelemetryEvent(
  event: RelayTelemetryEvent,
): Uint8Array {
  return textEncoder.encode(JSON.stringify(event));
}

export function deserializeTelemetryEvent(
  payload: Uint8Array,
): RelayTelemetryEvent {
  const jsonStr = textDecoder.decode(payload);
  const parsed = JSON.parse(jsonStr) as RelayTelemetryEvent;
  if (!parsed || typeof parsed.kind !== "string") {
    throw new Error("Invalid telemetry payload: missing 'kind' discriminator");
  }
  return parsed;
}
