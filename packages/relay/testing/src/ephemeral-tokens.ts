/**
 * CI Tunnel Ephemeral Token Provisioning & Cleanup
 *
 * Mints short-lived scoped JWT/tokens for CI workflows with strict 2-hour TTL caps
 * and manages automated garbage collection of tunnels and cloud resources on CI completion.
 *
 * Note for Octavia: Exported from @paddy-systems/relay-testing/ephemeral-tokens.
 */

export const MAX_CI_TTL_SECONDS = 7200; // 2 hours hard maximum

export interface EphemeralTokenConfig {
  ciRunnerId: string;
  repository: string;
  prNumber?: number;
  ttlSeconds?: number;
}

export interface EphemeralToken {
  tokenId: string;
  tokenSecret: string;
  createdAt: number;
  expiresAt: number;
  isRevoked: boolean;
  repository: string;
  prNumber?: number;
  resourceIds: string[];
}

export class EphemeralTokenManager {
  private tokens = new Map<string, EphemeralToken>();

  public mintToken(config: EphemeralTokenConfig): EphemeralToken {
    const ttlSeconds = Math.min(
      config.ttlSeconds ?? MAX_CI_TTL_SECONDS,
      MAX_CI_TTL_SECONDS,
    );
    const now = Date.now();
    const tokenId = `ci_tok_${Math.random().toString(36).slice(2, 12)}`;
    const tokenSecret = `sec_${Math.random().toString(36).slice(2, 18)}`;

    const token: EphemeralToken = {
      tokenId,
      tokenSecret,
      createdAt: now,
      expiresAt: now + ttlSeconds * 1000,
      isRevoked: false,
      repository: config.repository,
      prNumber: config.prNumber,
      resourceIds: [],
    };

    this.tokens.set(tokenId, token);
    return token;
  }

  public registerResource(tokenId: string, sessionId: string): void {
    const token = this.tokens.get(tokenId);
    if (!token) {
      throw new Error(`Invalid token ID: ${tokenId}`);
    }
    if (token.isRevoked) {
      throw new Error(`Token is already revoked: ${tokenId}`);
    }
    if (!token.resourceIds.includes(sessionId)) {
      token.resourceIds.push(sessionId);
    }
  }

  public validateToken(tokenId: string): { valid: boolean; reason?: string } {
    const token = this.tokens.get(tokenId);
    if (!token) {
      return { valid: false, reason: "Token not found" };
    }
    if (token.isRevoked) {
      return { valid: false, reason: "Token has been revoked" };
    }
    if (Date.now() > token.expiresAt) {
      return { valid: false, reason: "Token has expired (TTL exceeded)" };
    }
    return { valid: true };
  }

  public async revokeAndCleanup(
    tokenId: string,
    cleanupHandler?: (sessionId: string) => Promise<void>,
  ): Promise<{ cleanedSessions: string[] }> {
    const token = this.tokens.get(tokenId);
    if (!token) {
      return { cleanedSessions: [] };
    }

    token.isRevoked = true;
    const cleanedSessions: string[] = [];

    for (const sessionId of token.resourceIds) {
      if (cleanupHandler) {
        await cleanupHandler(sessionId);
      }
      cleanedSessions.push(sessionId);
    }

    token.resourceIds = [];
    return { cleanedSessions };
  }

  public async sweepExpired(
    cleanupHandler?: (sessionId: string) => Promise<void>,
  ): Promise<{ revokedTokenCount: number; cleanedSessions: string[] }> {
    const now = Date.now();
    let revokedTokenCount = 0;
    const allCleanedSessions: string[] = [];

    for (const token of this.tokens.values()) {
      if (!token.isRevoked && now > token.expiresAt) {
        revokedTokenCount++;
        const { cleanedSessions } = await this.revokeAndCleanup(
          token.tokenId,
          cleanupHandler,
        );
        allCleanedSessions.push(...cleanedSessions);
      }
    }

    return { revokedTokenCount, cleanedSessions: allCleanedSessions };
  }

  public getToken(tokenId: string): EphemeralToken | undefined {
    return this.tokens.get(tokenId);
  }
}
