/**
 * Device Safe Area Inset & Notch Emulation Visualizer
 *
 * Emulates mobile hardware display cutouts (Dynamic Island, notch, punch hole)
 * and generates CSS env(safe-area-inset-*) overlay guides for desktop inspection.
 *
 * Note for Octavia: This powers the safe area outline toggle in the Cloud Web receiver panel.
 */

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type CutoutType = "dynamic-island" | "notch" | "punch-hole" | "none";

export interface DeviceDisplayCutout {
  type: CutoutType;
  width: number;
  height: number;
  top: number;
  borderRadius?: number;
}

export interface DeviceCutoutProfile {
  id: string;
  deviceName: string;
  insets: SafeAreaInsets;
  cutout: DeviceDisplayCutout;
}

export const DEVICE_SAFE_AREA_PRESETS: Record<string, DeviceCutoutProfile> = {
  "iphone-16-pro": {
    id: "iphone-16-pro",
    deviceName: "iPhone 16 Pro / 15 Pro",
    insets: { top: 59, right: 0, bottom: 34, left: 0 },
    cutout: {
      type: "dynamic-island",
      width: 125,
      height: 35,
      top: 11,
      borderRadius: 20,
    },
  },
  "iphone-14": {
    id: "iphone-14",
    deviceName: "iPhone 14 / 13",
    insets: { top: 47, right: 0, bottom: 34, left: 0 },
    cutout: {
      type: "notch",
      width: 160,
      height: 32,
      top: 0,
      borderRadius: 16,
    },
  },
  "pixel-8": {
    id: "pixel-8",
    deviceName: "Google Pixel 8",
    insets: { top: 40, right: 0, bottom: 24, left: 0 },
    cutout: {
      type: "punch-hole",
      width: 24,
      height: 24,
      top: 10,
      borderRadius: 12,
    },
  },
  standard: {
    id: "standard",
    deviceName: "Generic Fullscreen (No Notch)",
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
    cutout: {
      type: "none",
      width: 0,
      height: 0,
      top: 0,
    },
  },
};

export class SafeAreaVisualizer {
  private currentProfile: DeviceCutoutProfile = {
    id: "iphone-16-pro",
    deviceName: "iPhone 16 Pro / 15 Pro",
    insets: { top: 59, right: 0, bottom: 34, left: 0 },
    cutout: {
      type: "dynamic-island",
      width: 125,
      height: 35,
      top: 11,
      borderRadius: 20,
    },
  };
  private visible = true;

  public getProfile(): DeviceCutoutProfile {
    return { ...this.currentProfile };
  }

  public setProfile(profileKeyOrData: string | DeviceCutoutProfile): boolean {
    if (typeof profileKeyOrData === "string") {
      const match = DEVICE_SAFE_AREA_PRESETS[profileKeyOrData];
      if (match) {
        this.currentProfile = { ...match };
        return true;
      }
      return false;
    }
    this.currentProfile = { ...profileKeyOrData };
    return true;
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
  }

  public generateCssVariables(): Record<string, string> {
    const { insets } = this.currentProfile;
    return {
      "--relay-safe-area-top": `${insets.top}px`,
      "--relay-safe-area-right": `${insets.right}px`,
      "--relay-safe-area-bottom": `${insets.bottom}px`,
      "--relay-safe-area-left": `${insets.left}px`,
    };
  }

  public renderCutoutHtml(): string {
    if (!this.visible || this.currentProfile.cutout.type === "none") {
      return "";
    }

    const { cutout } = this.currentProfile;
    return `<div class="relay-cutout relay-cutout-${cutout.type}" style="position: absolute; top: ${cutout.top}px; left: 50%; transform: translateX(-50%); width: ${cutout.width}px; height: ${cutout.height}px; border-radius: ${cutout.borderRadius || 0}px; background: #000000; pointer-events: none; z-index: 999990;"></div>`;
  }

  public renderHomeIndicatorHtml(): string {
    if (!this.visible || this.currentProfile.insets.bottom === 0) {
      return "";
    }

    return `<div class="relay-home-indicator" style="position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); width: 134px; height: 5px; border-radius: 100px; background: rgba(0, 0, 0, 0.4); pointer-events: none; z-index: 999990;"></div>`;
  }
}
