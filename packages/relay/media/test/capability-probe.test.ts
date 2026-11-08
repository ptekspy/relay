import { describe, expect, it } from "bun:test";
import {
  type BrowserMediaEnvironment,
  ScreenCaptureProbe,
} from "../src/capability-probe.js";

describe("TASK-151: Receiver Screen Capture Capability Probing & Permission Protocol", () => {
  it("probes browser with getDisplayMedia and permission query", async () => {
    const mockEnv: BrowserMediaEnvironment = {
      navigator: {
        mediaDevices: {
          getDisplayMedia: async () => ({}) as unknown as MediaStream,
        },
        permissions: {
          query: async () => ({ state: "granted" as const }),
        },
      },
    };

    const cap = await ScreenCaptureProbe.probeBrowser(mockEnv);
    expect(cap.supported).toBe(true);
    expect(cap.provider).toBe("display-media");
    expect(cap.permissionStatus).toBe("granted");
    expect(cap.maxResolution).toEqual({ width: 1920, height: 1080 });
  });

  it("reports unsupported when browser mediaDevices is absent", async () => {
    const cap = await ScreenCaptureProbe.probeBrowser({});
    expect(cap.supported).toBe(false);
    expect(cap.provider).toBe("unsupported");
    expect(cap.permissionStatus).toBe("denied");
  });

  it("probes Android receiver capability based on MediaProjection service availability", async () => {
    const supportedCap = await ScreenCaptureProbe.probeReceiver("android", {
      hasMediaProjection: true,
    });
    expect(supportedCap.supported).toBe(true);
    expect(supportedCap.provider).toBe("media-projection");
    expect(supportedCap.maxFramerate).toBe(30);

    const unsupportedCap = await ScreenCaptureProbe.probeReceiver("android", {
      hasMediaProjection: false,
    });
    expect(unsupportedCap.supported).toBe(false);
    expect(unsupportedCap.provider).toBe("unsupported");
  });

  it("probes iOS receiver capability based on ReplayKit broadcast support", async () => {
    const iosCap = await ScreenCaptureProbe.probeReceiver("ios", {
      hasReplayKit: true,
    });
    expect(iosCap.supported).toBe(true);
    expect(iosCap.provider).toBe("replaykit");
  });
});
