import type { ArchitectureDecisionRecord } from "./types.js";

export class RelayAdrManager {
  private static readonly ADRS: ArchitectureDecisionRecord[] = [
    {
      id: "ADR-001",
      title: "Binary Framing over WebSockets for Telemetry Transport",
      status: "accepted",
      date: "2026-01-10",
      context:
        "JSON-based WebSocket messages produced excessive serialization overhead on 120Hz DOM mutation streams.",
      decision:
        "Adopt custom 12-byte binary frame header with Zstd/Brotli payload compression.",
      consequences: [
        "Payload size reduced by 68%",
        "Zero-copy WASM parser enabled sub-millisecond parsing",
      ],
    },
    {
      id: "ADR-002",
      title: "Local-First Tunneling with Ephemeral Fallback Edge Gateway",
      status: "accepted",
      date: "2026-01-15",
      context:
        "Developers working on same Wi-Fi should not send high-bandwidth DOM streams through external clouds.",
      decision:
        "Direct LAN mDNS discovery first; fallback to Cloudflare Workers / Fly.io edge relay when networks are isolated.",
      consequences: [
        "Sub-5ms local pairing latency",
        "Reliable connectivity across strict enterprise networks",
      ],
    },
    {
      id: "ADR-003",
      title: "Zero-Trust Device Attestation with ECDSA P-256",
      status: "accepted",
      date: "2026-02-01",
      context:
        "Prevent stolen short codes or invite links from granting unauthorized session access.",
      decision:
        "Require ECDSA P-256 cryptographic hardware attestation tokens on every paired mobile receiver.",
      consequences: [
        "Session hijacking prevented",
        "Verifiable tamper-evident audit logs",
      ],
    },
    {
      id: "ADR-004",
      title: "Synthetic Device Farm Simulation & Chaos Harness Architecture",
      status: "accepted",
      date: "2026-02-20",
      context:
        "Validating receiver resilience across 500+ heterogeneous mobile devices without physical device labs.",
      decision:
        "Implement headless virtual receiver persona generator and flaky network chaos injector in simulation package.",
      consequences: [
        "High test coverage across flaky networks",
        "Zero reliance on external device cloud subscriptions",
      ],
    },
    {
      id: "ADR-005",
      title: "WebAssembly Acceleration with SIMD128 and Pure JS Fallback",
      status: "accepted",
      date: "2026-03-01",
      context:
        "Mobile web receivers experience thread contention when decompressing heavy DOM batches in JavaScript.",
      decision:
        "Compile Zstd and CRC32 algorithms to WebAssembly with SIMD128, providing automatic pure JS fallback on CSP-restricted hosts.",
      consequences: [
        "40% less CPU utilization on mobile receivers",
        "Full browser compatibility preserved",
      ],
    },
  ];

  public listAdrs(): ArchitectureDecisionRecord[] {
    return RelayAdrManager.ADRS;
  }

  public getAdrById(id: string): ArchitectureDecisionRecord | undefined {
    return RelayAdrManager.ADRS.find(
      (a) => a.id.toLowerCase() === id.toLowerCase(),
    );
  }

  public searchAdrs(query: string): ArchitectureDecisionRecord[] {
    const q = query.toLowerCase();
    return RelayAdrManager.ADRS.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.context.toLowerCase().includes(q) ||
        a.decision.toLowerCase().includes(q),
    );
  }
}

export const relayAdrManager = new RelayAdrManager();
