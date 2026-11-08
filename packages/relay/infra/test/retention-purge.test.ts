import { beforeEach, describe, expect, it } from "bun:test";
import { RetentionPurgeEngine } from "../src/retention-purge.js";

describe("TASK-196: Automated S3/R2 Recording Retention Lifecycle Purge Job", () => {
  let engine: RetentionPurgeEngine;
  const now = 1710000000000;
  const DAY_MS = 24 * 60 * 60 * 1000;

  beforeEach(() => {
    engine = new RetentionPurgeEngine();
  });

  it("purges Solo tier recordings older than 7 days and preserves newer recordings", () => {
    // 8-day-old Solo recording (expired)
    engine.registerArtifact({
      id: "art_solo_old",
      sessionId: "ses_1",
      customerId: "cus_solo_1",
      tier: "solo",
      storageUri: "s3://recordings/ses_1.rrweb",
      sizeBytes: 15_000_000, // 15MB
      createdAt: now - 8 * DAY_MS,
    });

    // 5-day-old Solo recording (valid)
    engine.registerArtifact({
      id: "art_solo_fresh",
      sessionId: "ses_2",
      customerId: "cus_solo_1",
      tier: "solo",
      storageUri: "s3://recordings/ses_2.rrweb",
      sizeBytes: 10_000_000, // 10MB
      createdAt: now - 5 * DAY_MS,
    });

    const purgeResult = engine.purgeExpiredArtifacts(now);

    expect(purgeResult.purgedCount).toBe(1);
    expect(purgeResult.reclaimedBytes).toBe(15_000_000);
    expect(purgeResult.remainingCount).toBe(1);

    expect(engine.getArtifact("art_solo_old")).toBeUndefined();
    expect(engine.getArtifact("art_solo_fresh")).toBeDefined();
  });

  it("respects Teams 30-day and Enterprise 90-day retention policies with structured audit logs", () => {
    // 35-day-old Teams recording (expired > 30 days)
    engine.registerArtifact({
      id: "art_teams_old",
      sessionId: "ses_teams",
      customerId: "cus_teams_corp",
      tier: "teams",
      storageUri: "r2://recordings/ses_teams.mp4",
      sizeBytes: 50_000_000,
      createdAt: now - 35 * DAY_MS,
    });

    // 40-day-old Enterprise recording (valid < 90 days)
    engine.registerArtifact({
      id: "art_ent_valid",
      sessionId: "ses_ent",
      customerId: "cus_enterprise_megacorp",
      tier: "enterprise",
      storageUri: "r2://recordings/ses_ent.mp4",
      sizeBytes: 120_000_000,
      createdAt: now - 40 * DAY_MS,
    });

    const result = engine.purgeExpiredArtifacts(now);

    expect(result.purgedCount).toBe(1);
    expect(result.auditLogs.length).toBe(1);

    const audit = result.auditLogs[0];
    expect(audit).toBeDefined();
    expect(audit?.artifactId).toBe("art_teams_old");
    expect(audit?.tier).toBe("teams");
    expect(audit?.ageDays).toBe(35);
    expect(audit?.reclaimedBytes).toBe(50_000_000);

    // Enterprise artifact retained
    expect(engine.getArtifact("art_ent_valid")).toBeDefined();
  });
});
