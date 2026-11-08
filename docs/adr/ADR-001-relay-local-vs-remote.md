# ADR-001: Dual Local/Remote Architecture Model

**Status:** Accepted  
**Date:** 2026-09-13  
**Deciders:** Paddy Systems Engineering  
**Technical Area:** Architecture, Security, Business Model

---

## Context and Problem Statement

Web developers building modern frontend applications frequently need to test their running development servers on physical mobile devices, secondary screens, and within remote cross-functional teams.

Existing market solutions (such as ngrok, Cloudflare Tunnels, or localtunnel) route 100% of traffic through cloud infrastructure by default. This introduces several major disadvantages:
1. Unnecessary round-trip latency (50ms–200ms) for devices sitting on the same local Wi-Fi router.
2. Bandwidth consumption on upstream dev assets (large JS bundles, video assets, source maps).
3. Data privacy and corporate IP concerns: private development source code and API credentials route through third-party servers.
4. Recurring SaaS operational costs for basic day-to-day LAN testing.

We need an architectural strategy that provides zero-latency testing for local workflows while simultaneously supporting remote access when developers are on disparate networks.

---

## Decision

We adopt a strict **Dual-Track Architectural Model**:

```
                       ┌───────────────────────────────────────────────┐
                       │          Developer Machine (CLI Host)         │
                       └───────────────┬───────────────────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                │ Local Mode (Direct)                         │ Remote Mode (Edge Brokered)
                ▼                                             ▼
     ┌──────────────────────┐                      ┌──────────────────────┐
     │  Direct LAN Bridge   │                      │  Cloud Edge Gateway  │
     │  (Port 7331 / LAN)   │                      │ (WSS / WebRTC Edge)  │
     └──────────┬───────────┘                      └──────────┬───────────┘
                │ <1ms latency                                │ Global edge routing
                ▼                                             ▼
     ┌──────────────────────┐                      ┌──────────────────────┐
     │  Local Phone / Tab   │                      │  Remote Collaborator │
     │ (Same Wi-Fi Network) │                      │   (External Network) │
     └──────────────────────┘                      └──────────────────────┘
```

### 1. Local Relay (Free Forever)
- **Transport**: Direct peer-to-peer HTTP/WebSocket over local area network IPv4/IPv6.
- **Port**: Default LAN gateway on port `7331`.
- **Cloud Dependency**: **Zero.** Does not hit any internet API or cloud signaling server.
- **Payload Privacy**: No data leaves the local subnet. Works completely offline in airplane mode or air-gapped environments.
- **Pricing**: Free forever, open-source CLI.

### 2. Remote Relay (Commercial Tiers)
- **Transport**: Edge WebSocket tunnels brokered through regional Anycast points of presence, upgrading to WebRTC DataChannels where NAT topology permits.
- **Security**: Strict end-to-end token verification, origin validation, and rate limiting.
- **Pricing**: Billed under Solo, Teams, or Enterprise subscriptions to cover bandwidth and edge routing infrastructure.

---

## Consequences

### Positive
- Instantaneous feedback loops for local mobile testing (< 1ms latency).
- Perfect developer trust: security-conscious enterprise teams can use Local Relay knowing zero code or API keys leave their laptop.
- Transparent monetization: developers only pay when they genuinely require external internet transit or team collaboration.

### Negative
- Local mode requires device to be on the same network subnet (can be hindered by strict corporate AP isolation or VPNs, addressed via preflight diagnostics).
- Separate transport adapters must be maintained in the protocol stack (direct LAN vs edge signaling).
