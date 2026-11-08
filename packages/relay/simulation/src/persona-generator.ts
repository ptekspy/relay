import type { VirtualDevicePersona } from "./types.js";

export class VirtualPersonaGenerator {
  private static readonly PRESETS: Array<
    Omit<VirtualDevicePersona, "id" | "batteryLevel">
  > = [
    {
      name: "iPhone 15 Pro",
      os: "iOS",
      osVersion: "17.4",
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
      viewport: { width: 393, height: 852, devicePixelRatio: 3 },
      networkType: "5g",
    },
    {
      name: "iPhone SE (3rd Gen)",
      os: "iOS",
      osVersion: "16.6",
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
      viewport: { width: 375, height: 667, devicePixelRatio: 2 },
      networkType: "4g",
    },
    {
      name: "Google Pixel 8",
      os: "Android",
      osVersion: "14",
      userAgent:
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
      viewport: { width: 412, height: 915, devicePixelRatio: 2.625 },
      networkType: "5g",
    },
    {
      name: "Samsung Galaxy S24 Ultra",
      os: "Android",
      osVersion: "14",
      userAgent:
        "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
      viewport: { width: 384, height: 832, devicePixelRatio: 3.75 },
      networkType: "wifi",
    },
    {
      name: "iPad Pro 11-inch",
      os: "iPadOS",
      osVersion: "17.4",
      userAgent:
        "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
      viewport: { width: 834, height: 1194, devicePixelRatio: 2 },
      networkType: "wifi",
    },
  ];

  public generatePersona(index = 0): VirtualDevicePersona {
    const preset =
      VirtualPersonaGenerator.PRESETS[
        index % VirtualPersonaGenerator.PRESETS.length
      ]!;
    return {
      ...preset,
      id: `sim-device-${index + 1}`,
      batteryLevel: Math.max(0.1, +(1 - (index % 10) * 0.08).toFixed(2)),
    };
  }

  public generateFleet(count: number): VirtualDevicePersona[] {
    return Array.from({ length: count }, (_, i) => this.generatePersona(i));
  }
}

export const virtualPersonaGenerator = new VirtualPersonaGenerator();
