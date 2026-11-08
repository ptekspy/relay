export class RelaySecurityWhitepaper {
  public static readonly THREAT_VECTORS = [
    {
      threat: "Man-In-The-Middle (MITM) on Local Wi-Fi",
      mitigation:
        "TLS 1.3 mutual authentication and local self-signed certificate pinning with ephemeral session keys.",
      riskLevel: "Low (Mitigated)",
    },
    {
      threat: "Session Hijacking via Stolen Short Code",
      mitigation:
        "6-character short codes expire in 10 minutes; rate limiting enforces max 5 failed pairing attempts before lockout.",
      riskLevel: "Low (Mitigated)",
    },
    {
      threat: "Malicious Webhook or SSRF Ingress",
      mitigation:
        "Strict IP range validation blocks RFC1918 subnets and cloud metadata endpoints (169.254.169.254).",
      riskLevel: "Zero (Blocked by SSRF filter)",
    },
    {
      threat: "Unencrypted Cloud Edge Relaying",
      mitigation:
        "AES-GCM-256 envelope encryption ensures edge servers cannot inspect DOM mutation payloads or console data.",
      riskLevel: "Zero (Zero-knowledge edge)",
    },
  ];

  public getThreatVectors() {
    return RelaySecurityWhitepaper.THREAT_VECTORS;
  }

  public getSummary(): string {
    return "Paddy Systems Relay employs a zero-trust, local-first architecture with end-to-end payload encryption and hardware-bound device attestation.";
  }
}

export const relaySecurityWhitepaper = new RelaySecurityWhitepaper();
