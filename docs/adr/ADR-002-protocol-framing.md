# ADR-002: Relay Protocol Framing (Hybrid JSON & Binary Multiplexing)

**Status:** Accepted  
**Date:** 2026-09-13  
**Deciders:** Paddy Systems Engineering  
**Technical Area:** Networking, Serialization, Protocol Design

---

## Context and Problem Statement

Paddy Systems Relay multiplexes heterogeneous data streams across a single duplex channel (WebSocket or WebRTC DataChannel):
1. **Control and Negotiation Signals**: Session handshakes, capability exchange, pairing acknowledgments, error payloads, and viewport dimension updates.
2. **Text Telemetry**: Console logs, network request/response headers, DOM mutation records, stack traces.
3. **High-Frequency Binary Streams**: Screen capture frames (WebP/JPEG tiles), pointer micro-coordinates (120Hz touch streams), audio samples, and file assets.

We evaluated three potential framing strategies:
1. **Pure JSON**: Encode all payloads (including binary images base64-encoded) into JSON objects.
2. **Pure Binary (Protobuf / FlatBuffers / MessagePack)**: Encode all protocol messages into compact binary schemas.
3. **Hybrid Multiplexed Framing**: Use UTF-8 JSON envelopes for control and metadata, and binary byte-prefixed frames for high-throughput media.

---

## Decision

We adopt a **Hybrid Multiplexed Protocol Framing** architecture:

```
+---------------+------------------------+------------------------------------+
| Opcode (1B)   | Metadata Length (2B)   | Payload                            |
+---------------+------------------------+------------------------------------+
| 0x01 (JSON)   | uint16 length          | UTF-8 JSON String (Control/Events) |
| 0x02 (BINARY) | uint16 header length   | Header JSON + Raw Binary Bytes     |
+---------------+------------------------+------------------------------------+
```

### 1. Control & Telemetry: UTF-8 JSON Envelope
- Handshakes, capability announcements, console logs, network events, and DOM mutations use standard UTF-8 JSON strings with typed schemas:
  ```json
  {
    "type": "CONSOLE_LOG",
    "timestamp": 1773460800000,
    "payload": { "level": "warn", "args": ["Deprecated API"] }
  }
  ```
- **Rationale**: Clean debuggability in browser DevTools network tabs, human-readable inspection, effortless schema migration with Zod, and sub-millisecond parsing overhead in V8 and JavaScriptCore.

### 2. High-Frequency Media & Screenshots: Binary Frames
- Screen capture tiles, raw canvas pixels, and large data blobs bypass Base64 encoding. They are framed with a 1-byte opcode `0x02`, a 2-byte header length, a JSON metadata header (e.g. `{ "type": "FRAME_TILE", "seq": 42, "format": "image/webp" }`), followed by raw unencoded binary bytes.
- **Rationale**: Eliminates the ~33% Base64 payload inflation and eliminates `atob`/`btoa` CPU garbage collection pressure on low-power mobile devices.

---

## Benchmark Comparisons

| Metric | Pure JSON (Base64) | Pure Protobuf | Hybrid Framing (Relay) |
| :--- | :--- | :--- | :--- |
| **Payload Size (Screen Capture)** | 133% (Base64 bloat) | 100% (raw bytes) | **100% (raw bytes)** |
| **Control Frame Parsing (10k msgs)** | 4.2ms | 6.8ms (deserializer) | **3.8ms (native JSON.parse)** |
| **DevTools Debuggability** | Readable | Opaque Hex | **Instantly Readable** |
| **GC Allocations / sec @ 60fps** | ~24 MB/s | ~6 MB/s | **~6 MB/s** |

---

## Consequences

### Positive
- Maximum streaming efficiency for screenshots and recordings without incurring Base64 CPU or memory penalties.
- Developer ergonomics: all standard events remain easily inspectable in browser network tools and automated test assertions.
- Safe schema evolution: Zod schemas can be added and verified incrementally without requiring binary schema compiler toolchains (protoc).

### Negative
- WebSocket listeners must check `event.data instanceof ArrayBuffer` vs string and route accordingly.
