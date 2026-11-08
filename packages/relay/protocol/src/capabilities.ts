export interface RelayCapabilities {
  touch: boolean;
  screenCapture: boolean;
  webrtc: boolean;
  viewportResize: boolean;
  consoleForwarding: boolean;
  networkInspection: boolean;
  binaryFraming: boolean;
}

export const DEFAULT_HOST_CAPABILITIES: Readonly<RelayCapabilities> =
  Object.freeze({
    touch: true,
    screenCapture: true,
    webrtc: true,
    viewportResize: true,
    consoleForwarding: true,
    networkInspection: true,
    binaryFraming: true,
  });

export const DEFAULT_RECEIVER_CAPABILITIES: Readonly<RelayCapabilities> =
  Object.freeze({
    touch: true,
    screenCapture: false,
    webrtc: true,
    viewportResize: true,
    consoleForwarding: true,
    networkInspection: true,
    binaryFraming: true,
  });

export interface CapabilityNegotiationResult {
  accepted: boolean;
  activeCapabilities: RelayCapabilities;
  protocolVersion: number;
}

/**
 * Negotiates active feature set between host and receiver based on mutual support.
 */
export function negotiateCapabilities(
  host: RelayCapabilities,
  receiver: RelayCapabilities,
  protocolVersion = 1,
): CapabilityNegotiationResult {
  const active: RelayCapabilities = {
    touch: host.touch && receiver.touch,
    screenCapture: host.screenCapture && receiver.screenCapture,
    webrtc: host.webrtc && receiver.webrtc,
    viewportResize: host.viewportResize && receiver.viewportResize,
    consoleForwarding: host.consoleForwarding && receiver.consoleForwarding,
    networkInspection: host.networkInspection && receiver.networkInspection,
    binaryFraming: host.binaryFraming && receiver.binaryFraming,
  };

  return {
    accepted: true,
    activeCapabilities: active,
    protocolVersion,
  };
}
