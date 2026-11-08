/**
 * Synchronized Multi-Receiver Browsing (Click & Scroll Mirroring)
 *
 * Implements "Follow Me" coordinated interaction: when developer or tester scrolls
 * or clicks on one receiver, the interaction is duplicated smoothly across all connected
 * devices using responsive viewport percentage ratios.
 *
 * Note for Octavia: This enables cross-device responsive QA and synchronized live demos.
 */

export interface SyncScrollEvent {
  type: "scroll";
  sourceDeviceId: string;
  scrollX: number;
  scrollY: number;
  scrollXRatio: number; // 0.0 to 1.0
  scrollYRatio: number; // 0.0 to 1.0
  timestamp: number;
}

export interface SyncClickEvent {
  type: "click";
  sourceDeviceId: string;
  xRatio: number; // 0.0 to 1.0
  yRatio: number; // 0.0 to 1.0
  selectorPath?: string;
  timestamp: number;
}

export type SyncInteractionEvent = SyncScrollEvent | SyncClickEvent;

export interface ScrollableTarget {
  scrollTo: (options: {
    left: number;
    top: number;
    behavior?: "auto" | "smooth";
  }) => void;
  scrollX: number;
  scrollY: number;
  innerWidth: number;
  innerHeight: number;
  document?: {
    documentElement: {
      scrollWidth: number;
      scrollHeight: number;
    };
    querySelector?: (selector: string) => Element | null;
    elementFromPoint?: (x: number, y: number) => Element | null;
  };
}

export class SyncBrowsingController {
  private enabled = true;
  private isApplyingRemote = false;
  private readonly deviceId: string;
  private broadcastHandler: ((event: SyncInteractionEvent) => void) | null =
    null;

  constructor(deviceId: string) {
    this.deviceId = deviceId;
  }

  public getDeviceId(): string {
    return this.deviceId;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public setBroadcastHandler(
    handler: (event: SyncInteractionEvent) => void,
  ): void {
    this.broadcastHandler = handler;
  }

  /**
   * Captures local scroll and broadcasts proportional scroll offsets
   */
  public captureScroll(
    scrollX: number,
    scrollY: number,
    maxScrollX: number,
    maxScrollY: number,
  ): SyncScrollEvent | null {
    if (!this.enabled || this.isApplyingRemote) return null;

    const scrollXRatio =
      maxScrollX > 0 ? Math.min(1, Math.max(0, scrollX / maxScrollX)) : 0;
    const scrollYRatio =
      maxScrollY > 0 ? Math.min(1, Math.max(0, scrollY / maxScrollY)) : 0;

    const event: SyncScrollEvent = {
      type: "scroll",
      sourceDeviceId: this.deviceId,
      scrollX,
      scrollY,
      scrollXRatio: Math.round(scrollXRatio * 10000) / 10000,
      scrollYRatio: Math.round(scrollYRatio * 10000) / 10000,
      timestamp: Date.now(),
    };

    if (this.broadcastHandler) {
      this.broadcastHandler(event);
    }

    return event;
  }

  /**
   * Applies incoming scroll event from another device
   */
  public applyRemoteScroll(
    event: SyncScrollEvent,
    target: ScrollableTarget,
  ): boolean {
    if (!this.enabled) return false;
    if (event.sourceDeviceId === this.deviceId) return false; // Ignore own echoes

    this.isApplyingRemote = true;
    try {
      const doc = target.document?.documentElement;
      const maxScrollX = doc
        ? Math.max(0, doc.scrollWidth - target.innerWidth)
        : 0;
      const maxScrollY = doc
        ? Math.max(0, doc.scrollHeight - target.innerHeight)
        : 0;

      const targetX =
        maxScrollX > 0
          ? Math.round(event.scrollXRatio * maxScrollX)
          : event.scrollX;
      const targetY =
        maxScrollY > 0
          ? Math.round(event.scrollYRatio * maxScrollY)
          : event.scrollY;

      target.scrollTo({ left: targetX, top: targetY, behavior: "auto" });
      return true;
    } finally {
      this.isApplyingRemote = false;
    }
  }

  /**
   * Applies incoming click event to targeted element
   */
  public applyRemoteClick(
    event: SyncClickEvent,
    target: {
      innerWidth: number;
      innerHeight: number;
      document: {
        querySelector?: (selector: string) => Element | null;
        elementFromPoint?: (x: number, y: number) => Element | null;
      };
    },
  ): boolean {
    if (!this.enabled) return false;
    if (event.sourceDeviceId === this.deviceId) return false;

    let targetEl: Element | null = null;

    if (event.selectorPath && target.document.querySelector) {
      targetEl = target.document.querySelector(event.selectorPath);
    }

    if (!targetEl && target.document.elementFromPoint) {
      const pixelX = Math.round(event.xRatio * target.innerWidth);
      const pixelY = Math.round(event.yRatio * target.innerHeight);
      targetEl = target.document.elementFromPoint(pixelX, pixelY);
    }

    if (targetEl && "dispatchEvent" in targetEl) {
      const clickEvent =
        typeof MouseEvent !== "undefined"
          ? new MouseEvent("click", { bubbles: true, cancelable: true })
          : { type: "click" };
      (targetEl as { dispatchEvent: (e: unknown) => boolean }).dispatchEvent(
        clickEvent,
      );
      return true;
    }

    return false;
  }
}
