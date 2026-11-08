export type ScreenCaptureType = "dom_replay" | "tab_stream" | "physical_screen";

export type ScreenCapturePermissionState =
  | "granted"
  | "prompt"
  | "denied"
  | "unsupported";

export interface ScreenCaptureFeasibility {
  supportedTypes: ScreenCaptureType[];
  permissionState: ScreenCapturePermissionState;
  recommendedType: ScreenCaptureType;
  requiresUserGesture: boolean;
}

export function evaluateScreenCaptureFeasibility(
  deviceType: string,
): ScreenCaptureFeasibility {
  // Mobile browsers (Safari iOS, Chrome Android) cannot capture OS screen without special native broadcast extensions
  if (deviceType === "mobile_browser" || deviceType === "ios_native") {
    return {
      supportedTypes: ["dom_replay"],
      permissionState: "granted",
      recommendedType: "dom_replay",
      requiresUserGesture: false,
    };
  }

  if (deviceType === "android_native") {
    return {
      supportedTypes: ["dom_replay", "physical_screen"],
      permissionState: "prompt",
      recommendedType: "physical_screen",
      requiresUserGesture: true,
    };
  }

  if (deviceType === "desktop_browser") {
    const hasDisplayMedia =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getDisplayMedia === "function";

    return {
      supportedTypes: hasDisplayMedia
        ? ["dom_replay", "tab_stream", "physical_screen"]
        : ["dom_replay"],
      permissionState: hasDisplayMedia ? "prompt" : "unsupported",
      recommendedType: "dom_replay",
      requiresUserGesture: true,
    };
  }

  return {
    supportedTypes: ["dom_replay"],
    permissionState: "unsupported",
    recommendedType: "dom_replay",
    requiresUserGesture: false,
  };
}
