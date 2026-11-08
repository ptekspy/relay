import type { RelayCapabilitySet } from "./schema.js";

export interface UnsupportedOperationPayload {
  code: "ERR_UNSUPPORTED_CAPABILITY";
  capability: keyof RelayCapabilitySet;
  message: string;
  remediation: string;
}

export function createUnsupportedOperationError(
  capability: keyof RelayCapabilitySet,
  deviceType?: string,
): UnsupportedOperationPayload {
  const remediationMessages: Record<keyof RelayCapabilitySet, string> = {
    dom: "DOM inspection requires a browser environment with document access.",
    console: "Console mirroring is unavailable in this environment.",
    network: "Network telemetry requires fetch/XHR proxy capabilities.",
    touch: "Touch emulation is not supported on non-touch devices.",
    screenshot:
      "Screen capture requires browser display-media permissions or native receiver.",
    screenRecording:
      "Video screen recording requires MediaRecorder API and screen capture permissions.",
    haptics:
      "Haptics requires a device with vibration motor support (e.g. mobile handset).",
    geolocation:
      "Geolocation requires GPS sensor hardware and user location permission.",
    battery: "Battery monitoring is not supported by this browser engine.",
    webgl:
      "Hardware-accelerated WebGL is disabled or unsupported by your graphics driver.",
    webrtc:
      "WebRTC P2P requires RTCPeerConnection and non-symmetric NAT traversal.",
    viewportResize: "Viewport resizing requires an iframe sandbox container.",
  };

  return {
    code: "ERR_UNSUPPORTED_CAPABILITY",
    capability,
    message: `Requested operation relies on '${capability}', which is not supported by ${deviceType || "the target receiver"}.`,
    remediation: remediationMessages[capability],
  };
}
