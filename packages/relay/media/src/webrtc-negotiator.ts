/**
 * WebRTC MediaStream Video Track Negotiator (getDisplayMedia)
 *
 * Configures RTCPeerConnection media tracks, SDP codec preferences (VP8, H.264),
 * and dynamic resolution constraints for low-latency live screen streaming.
 *
 * Note for Octavia: Connects browser receiver display capture to Cloud Web viewer.
 */

export type VideoResolution = "1080p" | "720p" | "540p";
export type VideoCodec = "VP8" | "H264" | "VP9" | "AV1";

export interface NegotiatorOptions {
  resolution?: VideoResolution;
  frameRate?: number;
  preferredCodec?: VideoCodec;
  iceServers?: RTCIceServer[];
}

export interface MockMediaStreamTrack {
  kind: "video" | "audio";
  id: string;
  enabled: boolean;
  stop?: () => void;
}

export interface MockMediaStream {
  id: string;
  getTracks: () => MockMediaStreamTrack[];
  getVideoTracks: () => MockMediaStreamTrack[];
}

export interface WebRtcNegotiationResult {
  localDescription: RTCSessionDescriptionInit;
  selectedCodec: VideoCodec;
  resolution: VideoResolution;
  constraints: {
    width: number;
    height: number;
    frameRate: number;
  };
}

export class WebRtcVideoNegotiator {
  public static getResolutionDimensions(resolution: VideoResolution): {
    width: number;
    height: number;
  } {
    switch (resolution) {
      case "1080p":
        return { width: 1920, height: 1080 };
      case "720p":
        return { width: 1280, height: 720 };
      case "540p":
        return { width: 960, height: 540 };
    }
  }

  public static getDisplayMediaConstraints(
    resolution: VideoResolution = "1080p",
    frameRate = 30,
  ) {
    const dim = WebRtcVideoNegotiator.getResolutionDimensions(resolution);
    return {
      video: {
        width: { ideal: dim.width, max: dim.width },
        height: { ideal: dim.height, max: dim.height },
        frameRate: { ideal: frameRate, max: frameRate },
      },
      audio: false,
    };
  }

  public static preferCodecInSdp(sdp: string, codec: VideoCodec): string {
    const codecRegex = new RegExp(`(rtpmap:\\d+\\s+${codec}/\\d+)`, "i");
    if (!codecRegex.test(sdp)) {
      return sdp;
    }

    // Move matching payload type to front of m=video line
    const lines = sdp.split("\r\n");
    let videoPayloadType: string | null = null;

    for (const line of lines) {
      if (
        line.toLowerCase().includes(`rtpmap:`) &&
        line.toLowerCase().includes(`${codec.toLowerCase()}/90000`)
      ) {
        const match = line.match(/a=rtpmap:(\d+)/);
        if (match && match[1]) {
          videoPayloadType = match[1];
          break;
        }
      }
    }

    if (!videoPayloadType) {
      return sdp;
    }

    return lines
      .map((line) => {
        if (line.startsWith("m=video")) {
          const parts = line.split(" ");
          const header = parts.slice(0, 3);
          const pts = parts.slice(3).filter((pt) => pt !== videoPayloadType);
          return [...header, videoPayloadType, ...pts].join(" ");
        }
        return line;
      })
      .join("\r\n");
  }

  public static async negotiateLocalOffer(
    pc: RTCPeerConnection,
    stream: MockMediaStream | MediaStream,
    options: NegotiatorOptions = {},
  ): Promise<WebRtcNegotiationResult> {
    const preferredCodec = options.preferredCodec ?? "VP8";
    const resolution = options.resolution ?? "1080p";
    const frameRate = options.frameRate ?? 30;

    const tracks = "getVideoTracks" in stream ? stream.getVideoTracks() : [];
    for (const track of tracks) {
      pc.addTrack(
        track as unknown as MediaStreamTrack,
        stream as unknown as MediaStream,
      );
    }

    const offer = await pc.createOffer();
    const modifiedSdp = offer.sdp
      ? WebRtcVideoNegotiator.preferCodecInSdp(offer.sdp, preferredCodec)
      : offer.sdp;

    const localDesc: RTCSessionDescriptionInit = {
      type: "offer",
      sdp: modifiedSdp,
    };

    await pc.setLocalDescription(localDesc);

    const dims = WebRtcVideoNegotiator.getResolutionDimensions(resolution);
    return {
      localDescription: localDesc,
      selectedCodec: preferredCodec,
      resolution,
      constraints: {
        width: dims.width,
        height: dims.height,
        frameRate,
      },
    };
  }
}
