import { describe, expect, it } from "bun:test";
import {
  type ScrollableTarget,
  SyncBrowsingController,
  type SyncScrollEvent,
} from "../src/sync-browsing.js";

describe("TASK-135: Synchronized Multi-Receiver Browsing", () => {
  it("captures local scroll and broadcasts proportional scroll ratios", () => {
    const controller = new SyncBrowsingController("device-desktop");
    const broadcasted: SyncScrollEvent[] = [];

    controller.setBroadcastHandler((evt) => {
      if (evt.type === "scroll") {
        broadcasted.push(evt);
      }
    });

    // Scrolled 500px down on a document with maxScrollY of 1000px (50%)
    const evt = controller.captureScroll(0, 500, 0, 1000);

    expect(evt).not.toBeNull();
    expect(evt?.scrollYRatio).toBe(0.5);
    expect(evt?.sourceDeviceId).toBe("device-desktop");
    expect(broadcasted.length).toBe(1);
  });

  it("applies remote scroll proportionally across differing screen dimensions", () => {
    const mobileController = new SyncBrowsingController("device-iphone");

    let scrolledTo = { left: 0, top: 0 };
    const mobileTarget: ScrollableTarget = {
      innerWidth: 390,
      innerHeight: 844,
      scrollX: 0,
      scrollY: 0,
      scrollTo: (opts) => {
        scrolledTo = { left: opts.left, top: opts.top };
      },
      document: {
        documentElement: {
          scrollWidth: 390,
          scrollHeight: 2844, // maxScrollY = 2844 - 844 = 2000px
        },
      },
    };

    const incomingDesktopScroll: SyncScrollEvent = {
      type: "scroll",
      sourceDeviceId: "device-desktop",
      scrollX: 0,
      scrollY: 800,
      scrollXRatio: 0,
      scrollYRatio: 0.5, // 50% down
      timestamp: Date.now(),
    };

    const applied = mobileController.applyRemoteScroll(
      incomingDesktopScroll,
      mobileTarget,
    );
    expect(applied).toBe(true);
    // 50% of 2000px maxScroll is exactly 1000px
    expect(scrolledTo.top).toBe(1000);
  });

  it("suppresses self-echoes to avoid infinite feedback loops", () => {
    const controller = new SyncBrowsingController("device-desktop");
    let scrollToCalled = false;

    const target: ScrollableTarget = {
      innerWidth: 1000,
      innerHeight: 800,
      scrollX: 0,
      scrollY: 0,
      scrollTo: () => {
        scrollToCalled = true;
      },
    };

    const echoEvent: SyncScrollEvent = {
      type: "scroll",
      sourceDeviceId: "device-desktop", // same device
      scrollX: 0,
      scrollY: 200,
      scrollXRatio: 0,
      scrollYRatio: 0.2,
      timestamp: Date.now(),
    };

    const applied = controller.applyRemoteScroll(echoEvent, target);
    expect(applied).toBe(false);
    expect(scrollToCalled).toBe(false);
  });
});
