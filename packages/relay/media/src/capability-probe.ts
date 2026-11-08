/**
 * Receiver Screen Capture Capability Probing & Permission Protocol
 *
 * Probes client platform for pixel-level screen capture support:
 * - Web: navigator.mediaDevices.getDisplayMedia
 * - Android: MediaProjectionManager / Foreground VirtualDisplay
 * - iOS: ReplayKit Broadcast Extension
 *
 * Note for Octavia: Used to conditionally enable the "Start Screen Stream" button.
 */

export type CaptureProviderType =
  | "display-media"
  | "media-projection"
  | "replaykit"
  | "unsupported";

export type PermissionStatus = "granted" | "denied" | "prompt" | "unknown";

export interface CaptureCapability {
  supported: boolean;
  provider: CaptureProviderType;
  maxResolution?: {
    width: number;
    height: number;
  };
  maxFramerate?: number;
  canStreamAudio: boolean;
  permissionStatus: PermissionStatus;
}

export interface BrowserMediaEnvironment {
  navigator?: {
    mediaDevices?: {
      getDisplayMedia?: (constraints?: unknown) => Promise<unknown>;
    };
    permissions?: {
      query?: (desc: { name: string }) => Promise<{ state: PermissionStatus }>;
    };
  };
}

export class ScreenCaptureProbe {
  public static async probeBrowser(
    env: BrowserMediaEnvironment = typeof window !== "undefined"
      ? (window as unknown as BrowserMediaEnvironment)
      : {},
  ): Promise<CaptureCapability> {
    const hasGetDisplayMedia =
      typeof env.navigator?.mediaDevices?.getDisplayMedia === "function";

    if (!hasGetDisplayMedia) {
      return {
        supported: false,
        provider: "unsupported",
        canStreamAudio: false,
        permissionStatus: "denied",
      };
    }

    let permissionStatus: PermissionStatus = "prompt";
    if (typeof env.navigator?.permissions?.query === "function") {
      try {
        const queryRes = await env.navigator.permissions.query({
          name: "display-capture",
        });
        permissionStatus = queryRes.state;
      } catch {
        // Fallback to prompt if permission query unsupported
        permissionStatus = "prompt";
      }
    }

    return {
      supported: true,
      provider: "display-media",
      maxResolution: { width: 1920, height: 1080 },
      maxFramerate: 60,
      canStreamAudio: true,
      permissionStatus,
    };
  }

  public static probeAndroid(
    hasMediaProjectionService: boolean,
  ): CaptureCapability {
    if (!hasMediaProjectionService) {
      return {
        supported: false,
        provider: "unsupported",
        canStreamAudio: false,
        permissionStatus: "denied",
      };
    }

    return {
      supported: true,
      provider: "media-projection",
      maxResolution: { width: 1920, height: 1080 },
      maxFramerate: 30,
      canStreamAudio: true,
      permissionStatus: "prompt",
    };
  }

  public static probeIos(hasReplayKit: boolean): CaptureCapability {
    if (!hasReplayKit) {
      return {
        supported: false,
        provider: "unsupported",
        canStreamAudio: false,
        permissionStatus: "denied",
      };
    }

    return {
      supported: true,
      provider: "replaykit",
      maxResolution: { width: 1920, height: 1080 },
      maxFramerate: 30,
      canStreamAudio: false,
      permissionStatus: "prompt",
    };
  }

  public static async probeReceiver(
    platform: "web" | "android" | "ios",
    context?: {
      hasMediaProjection?: boolean;
      hasReplayKit?: boolean;
      browserEnv?: BrowserMediaEnvironment;
    },
  ): Promise<CaptureCapability> {
    switch (platform) {
      case "web":
        return ScreenCaptureProbe.probeBrowser(context?.browserEnv);
      case "android":
        return ScreenCaptureProbe.probeAndroid(
          context?.hasMediaProjection ?? false,
        );
      case "ios":
        return ScreenCaptureProbe.probeIos(context?.hasReplayKit ?? false);
      default:
        return {
          supported: false,
          provider: "unsupported",
          canStreamAudio: false,
          permissionStatus: "denied",
        };
    }
  }
}
