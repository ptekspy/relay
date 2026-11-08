import { describe, expect, it } from "bun:test";
import {
  DEFAULT_ICE_SERVERS,
  DynamicTransportFallback,
  FlowControlBuffer,
  ReconnectionBackoff,
  StreamCompressor,
  TunnelEncryption,
  WebRtcDataTransport,
  WebSocketTunnelTransport,
} from "../src/index.js";

describe("Remote Transport & Tunnels (Epic 6)", () => {
  it("encrypts and decrypts payloads with AES-256-GCM", () => {
    const enc = new TunnelEncryption("super-secret-session-key-12345");
    const plaintext = new TextEncoder().encode("Hello Relay Tunnel Security!");

    const encrypted = enc.encrypt(plaintext);
    expect(encrypted.byteLength).toBe(plaintext.byteLength + 28);

    const decrypted = enc.decrypt(encrypted);
    expect(new TextDecoder().decode(decrypted)).toBe(
      "Hello Relay Tunnel Security!",
    );

    // Corrupted payload throws
    const tampered = new Uint8Array(encrypted);
    const lastIndex = tampered.byteLength - 1;
    tampered[lastIndex] = (tampered[lastIndex] ?? 0) ^ 0xff;
    expect(() => enc.decrypt(tampered)).toThrow();
  });

  it("compresses and decompresses data above threshold", () => {
    const compressor = new StreamCompressor(64);

    // Small data (< 64 bytes) bypasses compression
    const small = new Uint8Array([1, 2, 3, 4, 5]);
    const compressedSmall = compressor.compress(small);
    expect(compressedSmall[0]).toBe(0x00); // Uncompressed marker
    expect(compressor.decompress(compressedSmall)).toEqual(small);

    // Large repetitive payload (> 64 bytes) is compressed
    const large = new Uint8Array(1000).fill(65); // 1000 'A's
    const compressedLarge = compressor.compress(large);
    expect(compressedLarge[0]).toBe(0x01); // Gzip marker
    expect(compressedLarge.byteLength).toBeLessThan(large.byteLength);
    expect(compressor.decompress(compressedLarge)).toEqual(large);
  });

  it("manages backpressure and flow control watermarks", () => {
    const buffer = new FlowControlBuffer({
      highWatermarkBytes: 1000,
      lowWatermarkBytes: 400,
    });

    const pauseEvents: boolean[] = [];
    buffer.onPauseChange((paused) => pauseEvents.push(paused));

    // Push 600 bytes: no pause
    const chunk1 = new Uint8Array(600);
    expect(buffer.push(chunk1)).toBe(true);
    expect(buffer.paused).toBe(false);

    // Push 500 bytes: total 1100 >= 1000 -> triggers pause
    const chunk2 = new Uint8Array(500);
    expect(buffer.push(chunk2)).toBe(false);
    expect(buffer.paused).toBe(true);
    expect(pauseEvents).toEqual([true]);

    // Pull 600 bytes: total remaining 500 > 400 -> still paused
    expect(buffer.pull()).toBe(chunk1);
    expect(buffer.paused).toBe(true);

    // Pull 500 bytes: total remaining 0 <= 400 -> unpauses
    expect(buffer.pull()).toBe(chunk2);
    expect(buffer.paused).toBe(false);
    expect(pauseEvents).toEqual([true, false]);
  });

  it("calculates exponential backoff delays with jitter", () => {
    const backoff = new ReconnectionBackoff({
      initialDelayMs: 1000,
      factor: 2,
      maxDelayMs: 8000,
      jitterRatio: 0.1,
      maxAttempts: 4,
    });

    const d1 = backoff.nextDelayMs();
    expect(d1).toBeGreaterThanOrEqual(900);
    expect(d1).toBeLessThanOrEqual(1100);

    const d2 = backoff.nextDelayMs();
    expect(d2).toBeGreaterThanOrEqual(1800);
    expect(d2).toBeLessThanOrEqual(2200);

    const d3 = backoff.nextDelayMs();
    expect(d3).toBeGreaterThanOrEqual(3600);
    expect(d3).toBeLessThanOrEqual(4400);

    const d4 = backoff.nextDelayMs();
    expect(d4).toBeGreaterThanOrEqual(7200);
    expect(d4).toBeLessThanOrEqual(8800);

    // 5th attempt exceeds maxAttempts
    expect(backoff.nextDelayMs()).toBeNull();

    // Reset works
    backoff.reset();
    expect(backoff.currentAttempt).toBe(0);
  });

  it("switches candidates gracefully in dynamic transport fallback", async () => {
    const failingWebRtc = new WebRtcDataTransport();
    // Simulate connection failure by overriding connect
    failingWebRtc.connect = async () => {
      throw new Error("STUN/TURN gathering failed");
    };

    const workingWsTunnel = new WebSocketTunnelTransport({
      url: "wss://relay.cloud/tunnel",
    });

    const fallback = new DynamicTransportFallback([
      failingWebRtc,
      workingWsTunnel,
    ]);
    await fallback.connect();

    expect(fallback.transportType).toBe("ws_tunnel");
    expect(fallback.state).toBe("connected");

    await fallback.close();
    expect(fallback.state).toBe("closed");
  });

  it("provides valid Google STUN and Coturn TURN ICE server defaults", () => {
    expect(DEFAULT_ICE_SERVERS.length).toBeGreaterThanOrEqual(2);
    expect(DEFAULT_ICE_SERVERS[0]?.urls).toContain(
      "stun:stun.l.google.com:19302",
    );
    expect(DEFAULT_ICE_SERVERS[1]?.urls[0]?.startsWith("turn:")).toBe(true);
  });
});
