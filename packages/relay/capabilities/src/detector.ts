import type { RelayCapabilitySet } from "./schema.js";

export function detectBrowserCapabilities(): RelayCapabilitySet {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    // Headless / CLI default
    return {
      dom: false,
      console: true,
      network: true,
      touch: false,
      screenshot: false,
      screenRecording: false,
      haptics: false,
      geolocation: false,
      battery: false,
      webgl: false,
      webrtc: false,
      viewportResize: false,
    };
  }

  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const hasDisplayMedia = !!(
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getDisplayMedia === "function"
  );
  const hasHaptics = typeof navigator.vibrate === "function";
  const hasGeolocation = !!navigator.geolocation;
  const hasBattery =
    "getBattery" in navigator &&
    typeof (navigator as Navigator & { getBattery?: () => Promise<unknown> })
      .getBattery === "function";
  const hasWebRtc = typeof RTCPeerConnection !== "undefined";

  let hasWebGl = false;
  try {
    const canvas = document.createElement("canvas");
    hasWebGl = !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    hasWebGl = false;
  }

  return {
    dom: typeof document !== "undefined",
    console: typeof console !== "undefined",
    network:
      typeof window.fetch === "function" ||
      typeof XMLHttpRequest !== "undefined",
    touch: hasTouch,
    screenshot: hasDisplayMedia || typeof document !== "undefined",
    screenRecording: hasDisplayMedia,
    haptics: hasHaptics,
    geolocation: hasGeolocation,
    battery: hasBattery,
    webgl: hasWebGl,
    webrtc: hasWebRtc,
    viewportResize: true,
  };
}
