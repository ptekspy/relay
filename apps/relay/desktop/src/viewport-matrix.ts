import type { DeviceViewportSpec } from "./types.js";

export const DEFAULT_VIEWPORTS: DeviceViewportSpec[] = [
  {
    id: "iphone-15-pro",
    name: "iPhone 15 Pro",
    category: "mobile",
    width: 393,
    height: 852,
    devicePixelRatio: 3,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    hasTouch: true,
  },
  {
    id: "ipad-pro-11",
    name: "iPad Pro 11-inch",
    category: "tablet",
    width: 834,
    height: 1194,
    devicePixelRatio: 2,
    userAgent:
      "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    hasTouch: true,
  },
  {
    id: "desktop-laptop",
    name: "MacBook Air 13",
    category: "desktop",
    width: 1280,
    height: 800,
    devicePixelRatio: 2,
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    hasTouch: false,
  },
];

export class ViewportMatrixManager {
  private activeViewports: Map<string, DeviceViewportSpec> = new Map();
  private syncScrollEnabled = true;

  constructor(initialViewports: DeviceViewportSpec[] = DEFAULT_VIEWPORTS) {
    for (const vp of initialViewports) {
      this.activeViewports.set(vp.id, vp);
    }
  }

  public getActiveViewports(): DeviceViewportSpec[] {
    return Array.from(this.activeViewports.values());
  }

  public addViewport(spec: DeviceViewportSpec): void {
    this.activeViewports.set(spec.id, spec);
  }

  public removeViewport(id: string): boolean {
    return this.activeViewports.delete(id);
  }

  public setSyncScroll(enabled: boolean): void {
    this.syncScrollEnabled = enabled;
  }

  public isSyncScrollEnabled(): boolean {
    return this.syncScrollEnabled;
  }

  public calculateScrollSync(
    sourceViewportId: string,
    sourceScrollY: number,
    sourceTotalHeight: number,
    targetViewportId: string,
    targetTotalHeight: number,
  ): number {
    if (!this.syncScrollEnabled) return 0;
    if (sourceTotalHeight <= 0) return 0;

    const ratio = sourceScrollY / sourceTotalHeight;
    return Math.round(ratio * targetTotalHeight);
  }
}
