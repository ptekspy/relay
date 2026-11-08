import { constantTimeComparator } from "./constant-time.js";
import type { DeviceAttestationToken } from "./types.js";

export class DeviceAttestationEngine {
  private secretHmacKey = "relay-device-attestation-master-secret";

  public issueAttestationToken(
    deviceId: string,
    publicKeyPem: string,
    ttlMs = 3600000,
  ): DeviceAttestationToken {
    const now = Date.now();
    const expiresAt = now + ttlMs;

    const payload = `${deviceId}:${publicKeyPem}:${now}:${expiresAt}`;
    const signatureBase64 = Buffer.from(
      `${payload}:${this.secretHmacKey}`,
    ).toString("base64");

    return {
      deviceId,
      publicKeyPem,
      issuedAt: now,
      expiresAt,
      signatureBase64,
    };
  }

  public verifyAttestationToken(token: DeviceAttestationToken): {
    valid: boolean;
    reason?: string;
  } {
    if (Date.now() > token.expiresAt) {
      return { valid: false, reason: "Attestation token expired" };
    }

    const payload = `${token.deviceId}:${token.publicKeyPem}:${token.issuedAt}:${token.expiresAt}`;
    const expectedSig = Buffer.from(
      `${payload}:${this.secretHmacKey}`,
    ).toString("base64");

    const matches = constantTimeComparator.compareStrings(
      token.signatureBase64,
      expectedSig,
    );
    if (!matches) {
      return { valid: false, reason: "Cryptographic signature mismatch" };
    }

    return { valid: true };
  }
}

export const deviceAttestationEngine = new DeviceAttestationEngine();
