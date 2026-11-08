import { createHmac } from "node:crypto";

/**
 * Ephemeral Coturn / WebRTC ICE Credential Generator
 *
 * Implements standard RFC 5766 TURN REST API ephemeral credential generation
 * using HMAC-SHA1 signature over expiry timestamp and user identity.
 *
 * Note for Octavia: This provides WebRTC ICE credentials for CLI <-> Receiver peer traversal.
 */

export interface IceServerConfig {
  urls: string[];
  username: string;
  credential: string;
}

export interface TurnCredentialOptions {
  ttlSeconds?: number;
  turnHost?: string;
  turnPort?: number;
  turnsPort?: number;
}

export interface MintedIceCredentials {
  iceServers: IceServerConfig[];
  expiresAt: string;
  ttlSeconds: number;
}

export class TurnCredentialProvider {
  private readonly sharedSecret: string;
  private readonly turnHost: string;
  private readonly turnPort: number;
  private readonly turnsPort: number;
  private readonly defaultTtl: number;

  constructor(
    sharedSecret = "relay-turn-dev-secret-paddy-systems",
    options: TurnCredentialOptions = {},
  ) {
    this.sharedSecret = sharedSecret;
    this.turnHost = options.turnHost ?? "turn.relay.paddy.systems";
    this.turnPort = options.turnPort ?? 3478;
    this.turnsPort = options.turnsPort ?? 5349;
    this.defaultTtl = options.ttlSeconds ?? 7200; // 2 hours
  }

  public mintCredentials(
    userId: string,
    ttlSeconds?: number,
  ): MintedIceCredentials {
    const ttl = ttlSeconds ?? this.defaultTtl;
    const expiryTimestamp = Math.floor(Date.now() / 1000) + ttl;
    const username = `${expiryTimestamp}:${userId}`;

    // HMAC-SHA1 signature as per Coturn REST API specification
    const hmac = createHmac("sha1", this.sharedSecret);
    hmac.update(username);
    const credential = hmac.digest("base64");

    const urls = [
      `stun:${this.turnHost}:${this.turnPort}`,
      `turn:${this.turnHost}:${this.turnPort}?transport=udp`,
      `turn:${this.turnHost}:${this.turnPort}?transport=tcp`,
      `turns:${this.turnHost}:${this.turnsPort}?transport=tcp`,
    ];

    const expiresAt = new Date(expiryTimestamp * 1000).toISOString();

    return {
      iceServers: [
        {
          urls,
          username,
          credential,
        },
      ],
      expiresAt,
      ttlSeconds: ttl,
    };
  }

  public verifyCredential(username: string, credential: string): boolean {
    const parts = username.split(":");
    if (parts.length < 2) return false;

    const expiry = Number.parseInt(parts[0] || "0", 10);
    const now = Math.floor(Date.now() / 1000);
    if (now > expiry) return false; // Expired

    const hmac = createHmac("sha1", this.sharedSecret);
    hmac.update(username);
    const expected = hmac.digest("base64");

    return credential === expected;
  }
}
