import { describe, expect, it } from "bun:test";
import { AdaptiveBitrateController } from "../src/bitrate-controller.js";

describe("TASK-155: H.264 / VP8 Video Encoding & Adaptive Bitrate Controller", () => {
  it("dynamically adjusts bitrate and resolution tiers according to network quality", () => {
    const controller = new AdaptiveBitrateController();

    // High quality initial state
    expect(controller.getCurrentProfile().tier).toBe("high");
    expect(controller.getCurrentProfile().targetBitrateKbps).toBe(4000);

    // Medium quality with moderate RTT
    const medProfile = controller.evaluateNetwork({
      rttMs: 120,
      packetLossRatio: 0.03,
    });
    expect(medProfile.tier).toBe("medium");
    expect(medProfile.resolution).toEqual({ width: 1280, height: 720 });
    expect(medProfile.scaleResolutionDownBy).toBe(1.5);

    // Low quality with higher packet loss
    const lowProfile = controller.evaluateNetwork({
      rttMs: 220,
      packetLossRatio: 0.08,
    });
    expect(lowProfile.tier).toBe("low");
    expect(lowProfile.resolution).toEqual({ width: 960, height: 540 });
    expect(lowProfile.targetFrameRate).toBe(24);

    // Minimal tier with severe packet loss
    const minProfile = controller.evaluateNetwork({
      rttMs: 400,
      packetLossRatio: 0.18,
    });
    expect(minProfile.tier).toBe("minimal");
    expect(minProfile.targetBitrateKbps).toBe(400);
    expect(minProfile.targetFrameRate).toBe(15);
  });

  it("applies target parameters onto RTCRtpSender encodings", async () => {
    const controller = new AdaptiveBitrateController("medium");
    let appliedParameters: RTCRtpSendParameters | null = null;

    const mockSender = {
      getParameters: () =>
        ({
          encodings: [{} as RTCRtpEncodingParameters],
        }) as unknown as RTCRtpSendParameters,
      setParameters: async (params: RTCRtpSendParameters) => {
        appliedParameters = params;
      },
    } as unknown as RTCRtpSender;

    const success = await controller.applyToSender(mockSender);
    expect(success).toBe(true);
    expect(appliedParameters).not.toBeNull();
    const enc = (appliedParameters as unknown as RTCRtpSendParameters)
      .encodings[0];
    expect(enc?.maxBitrate).toBe(2000000); // 2000 kbps in bps
    expect(enc?.scaleResolutionDownBy).toBe(1.5);
    expect(enc?.maxFramerate).toBe(30);
  });
});
