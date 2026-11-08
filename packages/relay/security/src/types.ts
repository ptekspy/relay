/**
 * @paddy-systems/relay-security
 * Types for security governance, attestation, and cryptographic vault.
 */

export interface SecurityAuditEvent {
  id: string;
  timestamp: number;
  actorId: string;
  action:
    | "login"
    | "pairing_requested"
    | "device_attested"
    | "token_revoked"
    | "e2ee_key_exchanged";
  targetResource: string;
  clientIp: string;
  metadata?: Record<string, unknown>;
  previousHash?: string;
  eventHash?: string;
}

export interface PiiScanFinding {
  patternName: string;
  severity: "critical" | "high" | "medium";
  matchedText: string;
  maskedText: string;
  startIndex: number;
  endIndex: number;
}

export interface EncryptedPayloadEnvelope {
  ciphertextBase64: string;
  ivBase64: string;
  tagBase64: string;
  keyId: string;
}

export interface DeviceAttestationToken {
  deviceId: string;
  publicKeyPem: string;
  issuedAt: number;
  expiresAt: number;
  signatureBase64: string;
}

export interface OAuthStateRecord {
  state: string;
  originalRedirectUri: string;
  clientOrigin?: string;
  createdAt: number;
  pkceVerifier?: string;
}

export interface OAuthCallbackForwardResult {
  statusCode: number;
  location?: string;
  setCookieHeaders: string[];
  body?: string;
}

export interface LanTlsBundle {
  cert: string;
  key: string;
  ca?: string;
  isTrustedWildcard: boolean;
  domain: string;
  expiresAt?: string;
}

export interface DnsProbeResult {
  domain: string;
  resolvedIp?: string;
  expectedIp: string;
  rebindingBlocked: boolean;
  message: string;
}
