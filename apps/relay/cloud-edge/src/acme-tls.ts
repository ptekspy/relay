/**
 * Automated ACME / Dynamic TLS Provisioning Engine
 *
 * Coordinates on-demand SSL/TLS certificate generation, renewal triggers,
 * ACME HTTP-01 challenge validation, and modern cipher configuration.
 *
 * Note for Octavia: This module provisions and rotates TLS certs for the edge router.
 */

export interface TlsCertificateRecord {
  domain: string;
  isWildcard: boolean;
  certPem: string;
  keyPem: string;
  fingerprintSha256: string;
  issuedAt: string;
  expiresAt: string;
  status: "valid" | "renewing" | "expired" | "pending_challenge";
}

export interface AcmeChallengeToken {
  token: string;
  keyAuthorization: string;
  domain: string;
  expiresAt: string;
}

export interface AcmeTlsConfig {
  renewalThresholdDays?: number;
  acmeDirectoryUrl?: string;
  contactEmail?: string;
}

export class AcmeTlsManager {
  private readonly renewalThresholdDays: number;
  private readonly certStore = new Map<string, TlsCertificateRecord>();
  private readonly challengeStore = new Map<string, AcmeChallengeToken>();

  public static readonly RECOMMENDED_CIPHERS = [
    "TLS_AES_128_GCM_SHA256",
    "TLS_AES_256_GCM_SHA384",
    "TLS_CHACHA20_POLY1305_SHA256",
    "ECDHE-ECDSA-AES128-GCM-SHA256",
    "ECDHE-RSA-AES128-GCM-SHA256",
    "ECDHE-ECDSA-AES256-GCM-SHA384",
    "ECDHE-RSA-AES256-GCM-SHA384",
  ].join(":");

  constructor(config: AcmeTlsConfig = {}) {
    this.renewalThresholdDays = config.renewalThresholdDays ?? 30;
  }

  public registerCertificate(record: TlsCertificateRecord): void {
    this.certStore.set(record.domain.toLowerCase(), record);
  }

  public getCertificate(domain: string): TlsCertificateRecord | null {
    const cleanDomain = domain.toLowerCase().trim();

    // 1. Exact match
    const exact = this.certStore.get(cleanDomain);
    if (exact) return exact;

    // 2. Wildcard match (e.g. *.relay.paddy.systems matching session1.relay.paddy.systems)
    const dotIndex = cleanDomain.indexOf(".");
    if (dotIndex !== -1) {
      const parentWildcard = `*${cleanDomain.slice(dotIndex)}`;
      const wildcard = this.certStore.get(parentWildcard);
      if (wildcard) return wildcard;
    }

    return null;
  }

  public isCertificateDueForRenewal(
    record: TlsCertificateRecord,
    now: Date = new Date(),
  ): boolean {
    const expiry = new Date(record.expiresAt);
    const msRemaining = expiry.getTime() - now.getTime();
    const daysRemaining = msRemaining / (1000 * 60 * 60 * 24);
    return daysRemaining <= this.renewalThresholdDays;
  }

  public storeChallenge(token: AcmeChallengeToken): void {
    this.challengeStore.set(token.token, token);
  }

  public getChallenge(tokenKey: string, now: Date = new Date()): string | null {
    const challenge = this.challengeStore.get(tokenKey);
    if (!challenge) return null;

    if (now > new Date(challenge.expiresAt)) {
      this.challengeStore.delete(tokenKey);
      return null;
    }

    return challenge.keyAuthorization;
  }

  public cleanupExpiredChallenges(now: Date = new Date()): number {
    let purged = 0;
    for (const [key, challenge] of this.challengeStore.entries()) {
      if (now > new Date(challenge.expiresAt)) {
        this.challengeStore.delete(key);
        purged++;
      }
    }
    return purged;
  }

  public getTlsSecurityProfile(): {
    minVersion: string;
    ciphers: string;
    hstsMaxAge: number;
  } {
    return {
      minVersion: "TLSv1.2",
      ciphers: AcmeTlsManager.RECOMMENDED_CIPHERS,
      hstsMaxAge: 31536000, // 1 year HSTS
    };
  }
}
