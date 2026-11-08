import { beforeEach, describe, expect, it } from "bun:test";
import { Soc2ComplianceEngine } from "../src/soc2-anonymizer.js";

describe("TASK-198: SOC 2 Compliance Audit Trail & Data Anonymization Engine", () => {
  let engine: Soc2ComplianceEngine;

  beforeEach(() => {
    engine = new Soc2ComplianceEngine();

    // Setup mock user data
    engine.registerUser({
      id: "usr_alice",
      email: "alice@example.com",
      name: "Alice Engineer",
      ipAddresses: ["192.0.2.1", "198.51.100.5"],
      createdAt: 1700000000000,
    });

    engine.registerSession({
      id: "ses_alice_1",
      userId: "usr_alice",
      targetPort: 3000,
      clientIp: "192.0.2.1",
      startedAt: 1700000500000,
    });

    engine.registerSession({
      id: "ses_alice_2",
      userId: "usr_alice",
      targetPort: 8080,
      clientIp: "198.51.100.5",
      startedAt: 1700001000000,
    });

    engine.logAuditEvent({
      id: "aud_1",
      actorUserId: "usr_alice",
      action: "tunnel.create",
      details: "Alice Engineer started tunnel from alice@example.com",
      timestamp: 1700000510000,
    });
  });

  it("exports comprehensive GDPR Data Subject Access Request (DSR) archive", async () => {
    const pkg = await engine.exportUserData("usr_alice");

    expect(pkg.userId).toBe("usr_alice");
    expect(pkg.profile.email).toBe("alice@example.com");
    expect(pkg.knownIpAddresses).toEqual(["192.0.2.1", "198.51.100.5"]);
    expect(pkg.sessions.length).toBe(2);
    expect(pkg.auditLogs.length).toBe(1);
    expect(pkg.auditLogs[0]?.action).toBe("tunnel.create");
  });

  it("permanently erases PII and verifies zero leftover records in < 60 seconds", async () => {
    const result = await engine.executeDataDeletion("usr_alice");

    expect(result.zeroRecordsVerified).toBe(true);
    expect(result.scrubbedRecords.usersScrubbed).toBe(1);
    expect(result.scrubbedRecords.sessionsDeleted).toBe(2);
    expect(result.scrubbedRecords.auditLogsAnonymized).toBe(1);

    // Duration criteria: completes within 60,000ms (< 60 seconds)
    expect(result.durationMs).toBeLessThan(1000);

    // Subsequent export must fail
    expect(engine.exportUserData("usr_alice")).rejects.toThrow(
      "User not found",
    );
  });
});
