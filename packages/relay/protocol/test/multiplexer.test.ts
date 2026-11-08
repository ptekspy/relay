import { describe, expect, it } from "bun:test";
import { FrameType, type RelayFrame } from "../src/frame.js";
import {
  CHANNEL_CONTROL,
  CHANNEL_PROXY,
  CHANNEL_TELEMETRY,
  StreamDemultiplexer,
  StreamMultiplexer,
} from "../src/multiplexer.js";

describe("StreamMultiplexer & StreamDemultiplexer", () => {
  it("multiplexes and demultiplexes multiple channels over a shared stream", async () => {
    const demux = new StreamDemultiplexer();
    const mux = new StreamMultiplexer((raw) => {
      // Direct piping to demultiplexer
      demux.feed(raw);
    });

    const controlFrames: RelayFrame[] = [];
    const proxyFrames: RelayFrame[] = [];
    const telemetryFrames: RelayFrame[] = [];

    demux.onChannel(CHANNEL_CONTROL, (f) => controlFrames.push(f));
    demux.onChannel(CHANNEL_PROXY, (f) => proxyFrames.push(f));
    demux.onChannel(CHANNEL_TELEMETRY, (f) => telemetryFrames.push(f));

    await mux.send(
      CHANNEL_CONTROL,
      FrameType.CONTROL,
      new TextEncoder().encode("AUTH_HANDSHAKE"),
    );
    await mux.send(
      CHANNEL_PROXY,
      FrameType.STREAM,
      new TextEncoder().encode("GET / HTTP/1.1\r\n\r\n"),
    );
    await mux.send(
      CHANNEL_TELEMETRY,
      FrameType.EVENT,
      new TextEncoder().encode('{"kind":"console","level":"info"}'),
    );

    expect(controlFrames.length).toBe(1);
    expect(new TextDecoder().decode(controlFrames[0]?.payload)).toBe(
      "AUTH_HANDSHAKE",
    );

    expect(proxyFrames.length).toBe(1);
    expect(new TextDecoder().decode(proxyFrames[0]?.payload)).toBe(
      "GET / HTTP/1.1\r\n\r\n",
    );

    expect(telemetryFrames.length).toBe(1);
    expect(new TextDecoder().decode(telemetryFrames[0]?.payload)).toBe(
      '{"kind":"console","level":"info"}',
    );
  });

  it("handles byte fragmentation across network chunks", async () => {
    const demux = new StreamDemultiplexer();
    let sentBuffer: Uint8Array = new Uint8Array(0);

    const mux = new StreamMultiplexer((raw) => {
      sentBuffer = raw;
    });

    const received: RelayFrame[] = [];
    demux.onChannel(CHANNEL_PROXY, (f) => received.push(f));

    const largePayload = new Uint8Array(1000).fill(65); // 1000 'A's
    await mux.send(CHANNEL_PROXY, FrameType.STREAM, largePayload);

    // Feed in small 64-byte fragments simulating TCP MTU packet fragmentation
    const chunkSize = 64;
    for (let i = 0; i < sentBuffer.byteLength; i += chunkSize) {
      const slice = sentBuffer.subarray(i, i + chunkSize);
      demux.feed(slice);
    }

    expect(received.length).toBe(1);
    expect(received[0]?.payload.byteLength).toBe(1000);
    expect(received[0]?.payload[0]).toBe(65);
    expect(received[0]?.payload[999]).toBe(65);
  });
});
