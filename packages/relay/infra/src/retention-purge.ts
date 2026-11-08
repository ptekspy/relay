/**
 * Automated S3/R2 Recording Retention Lifecycle Purge Job
 *
 * Enforces tier-based retention policies:
 * - Free: 1 day (24 hours)
 * - Solo: 7 days
 * - Teams: 30 days
 * - Enterprise: 90 days
 *
 * Purges expired storage objects and database records with structured audit logging.
 *
 * Note for Octavia: Exported from @paddy-systems/relay-infra/retention.
 */

export type CustomerTier = "free" | "solo" | "teams" | "enterprise";

export const RETENTION_LIMIT_DAYS: Record<CustomerTier, number> = {
  free: 1,
  solo: 7,
  teams: 30,
  enterprise: 90,
};

export interface StoredArtifactRecord {
  id: string;
  sessionId: string;
  customerId: string;
  tier: CustomerTier;
  storageUri: string;
  sizeBytes: number;
  createdAt: number;
}

export interface PurgeAuditRecord {
  id: string;
  artifactId: string;
  sessionId: string;
  customerId: string;
  tier: CustomerTier;
  ageDays: number;
  reclaimedBytes: number;
  deletedAt: number;
}

export interface PurgeJobResult {
  purgedCount: number;
  reclaimedBytes: number;
  remainingCount: number;
  auditLogs: PurgeAuditRecord[];
}

export class RetentionPurgeEngine {
  private artifacts = new Map<string, StoredArtifactRecord>();
  private auditHistory: PurgeAuditRecord[] = [];

  public registerArtifact(artifact: StoredArtifactRecord): void {
    this.artifacts.set(artifact.id, { ...artifact });
  }

  public getArtifact(id: string): StoredArtifactRecord | undefined {
    return this.artifacts.get(id);
  }

  public listArtifacts(): StoredArtifactRecord[] {
    return Array.from(this.artifacts.values());
  }

  public getAuditHistory(): PurgeAuditRecord[] {
    return [...this.auditHistory];
  }

  public purgeExpiredArtifacts(now = Date.now()): PurgeJobResult {
    let purgedCount = 0;
    let reclaimedBytes = 0;
    const currentRunAudits: PurgeAuditRecord[] = [];

    for (const [id, artifact] of this.artifacts.entries()) {
      const allowedDays = RETENTION_LIMIT_DAYS[artifact.tier];
      const maxAgeMs = allowedDays * 24 * 60 * 60 * 1000;
      const ageMs = now - artifact.createdAt;

      if (ageMs > maxAgeMs) {
        const ageDays = Number((ageMs / (24 * 60 * 60 * 1000)).toFixed(1));
        const audit: PurgeAuditRecord = {
          id: `audit_purge_${Math.random().toString(36).substring(2, 10)}`,
          artifactId: artifact.id,
          sessionId: artifact.sessionId,
          customerId: artifact.customerId,
          tier: artifact.tier,
          ageDays,
          reclaimedBytes: artifact.sizeBytes,
          deletedAt: now,
        };

        this.artifacts.delete(id);
        this.auditHistory.push(audit);
        currentRunAudits.push(audit);

        purgedCount++;
        reclaimedBytes += artifact.sizeBytes;
      }
    }

    return {
      purgedCount,
      reclaimedBytes,
      remainingCount: this.artifacts.size,
      auditLogs: currentRunAudits,
    };
  }
}
