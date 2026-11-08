import { describe, expect, it } from "bun:test";
import {
  type MockMediaStream,
  WebRtcVideoNegotiator,
} from "../src/webrtc-negotiator.js";

describe("TASK-152: WebRTC MediaStream Video Track Negotiator", () => {
  it("calculates exact constraints for 1080p and 720p 30fps streaming", () => {
    const c1080 = WebRtcVideoNegotiator.getDisplayMediaConstraints("1080p", 30);
    expect(c1080.video.width).toEqual({ ideal: 1920, max: 1920 });
    expect(c1080.video.height).toEqual({ ideal: 1080, max: 1080 });
    expect(c1080.video.frameRate).toEqual({ ideal: 30, max: 30 });

    const c720 = WebRtcVideoNegotiator.getDisplayMediaConstraints("720p", 60);
    expect(c720.video.width).toEqual({ ideal: 1280, max: 1280 });
    expect(c720.video.frameRate).toEqual({ ideal: 60, max: 60 });
  });

  it("modifies SDP to prioritize preferred codec payload types", () => {
    const sampleSdp = [
      "v=0",
      "m=video 9 UDP/TLS/RTP/SAVPF 96 97 98",
      "a=rtpmap:96 H264/90000",
      "a=rtpmap:97 VP8/90000",
      "a=rtpmap:98 VP9/90000",
    ].join("\r\n");

    const vp8Prioritized = WebRtcVideoNegotiator.preferCodecInSdp(
      sampleSdp,
      "VP8",
    );
    expect(vp8Prioritized).toContain("m=video 9 UDP/TLS/RTP/SAVPF 97 96 98");

    const h264Prioritized = WebRtcVideoNegotiator.preferCodecInSdp(
      sampleSdp,
      "H264",
    );
    expect(h264Prioritized).toContain("m=video 9 UDP/TLS/RTP/SAVPF 96 97 98");
  });

  it("negotiates local offer attaching video tracks and setting local description", async () => {
    let localDescriptionSet: RTCSessionDescriptionInit | null = null;
    const addedTracks: unknown[] = [];

    const mockPc = {
      addTrack: (track: unknown) => {
        addedTracks.push(track);
      },
      createOffer: async () => ({
        type: "offer" as const,
        sdp: "v=0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96 97\r\na=rtpmap:96 H264/90000\r\na=rtpmap:97 VP8/90000",
      }),
      setLocalDescription: async (desc: RTCSessionDescriptionInit) => {
        localDescriptionSet = desc;
      },
    } as unknown as RTCPeerConnection;

    const mockStream: MockMediaStream = {
      id: "stream-screen",
      getTracks: () => [{ kind: "video", id: "trk-1", enabled: true }],
      getVideoTracks: () => [{ kind: "video", id: "trk-1", enabled: true }],
    };

    const startTime = performance.now();
    const result = await WebRtcVideoNegotiator.negotiateLocalOffer(
      mockPc,
      mockStream,
      {
        preferredCodec: "VP8",
        resolution: "1080p",
        frameRate: 30,
      },
    );
    const duration = performance.now() - startTime;

    expect(duration).toBeLessThan(2000); // Negotiates in < 2 seconds
    expect(addedTracks.length).toBe(1);
    expect(result.selectedCodec).toBe("VP8");
    expect(result.resolution).toBe("1080p");
    expect(localDescriptionSet).not.toBeNull();
    expect(
      (localDescriptionSet as unknown as RTCSessionDescriptionInit)?.sdp,
    ).toContain("m=video 9 UDP/TLS/RTP/SAVPF 97 96");
  });
});
