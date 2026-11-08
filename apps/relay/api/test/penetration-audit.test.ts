import { describe, expect, it } from "bun:test";
import { ForbiddenError } from "../src/auth/rbac.js";
import {
  type SecurityPrincipal,
  TenantIsolationGuard,
  type TenantResource,
} from "../src/auth/tenant-guard.js";

describe("TASK-170: Team Access Security & Penetration Audit Harness", () => {
  const teamAPrincipal: SecurityPrincipal = {
    userId: "attacker_a",
    teamId: "team_alpha",
    role: "ADMIN",
  };

  const teamBPrincipal: SecurityPrincipal = {
    userId: "victim_b",
    teamId: "team_beta",
    role: "ENGINEER",
  };

  const teamBSession: TenantResource = {
    id: "sess_beta_42",
    teamId: "team_beta",
    type: "session",
  };

  const teamBRecording: TenantResource = {
    id: "rec_beta_99",
    teamId: "team_beta",
    type: "recording",
  };

  const teamBInvite: TenantResource = {
    id: "inv_beta_01",
    teamId: "team_beta",
    type: "invite",
  };

  const teamBDevice: TenantResource = {
    id: "dev_beta_pixel",
    teamId: "team_beta",
    type: "device",
  };

  it("Attack Vector 1: Cross-tenant session inspection is blocked", () => {
    expect(() =>
      TenantIsolationGuard.assertAccess(teamAPrincipal, teamBSession),
    ).toThrow(ForbiddenError);

    // Legitimate owner passes
    expect(() =>
      TenantIsolationGuard.assertAccess(teamBPrincipal, teamBSession),
    ).not.toThrow();
  });

  it("Attack Vector 2: Cross-tenant recording exfiltration is blocked", () => {
    try {
      TenantIsolationGuard.assertAccess(teamAPrincipal, teamBRecording);
      expect(true).toBe(false);
    } catch (err) {
      expect(err instanceof ForbiddenError).toBe(true);
      expect((err as ForbiddenError).statusCode).toBe(403);
      expect((err as Error).message).toContain("Cross-tenant access violation");
    }
  });

  it("Attack Vector 3: Cross-tenant invitation tampering is blocked", () => {
    expect(() =>
      TenantIsolationGuard.assertAccess(teamAPrincipal, teamBInvite),
    ).toThrow(ForbiddenError);
  });

  it("Attack Vector 4: Cross-tenant shared device takeover is blocked", () => {
    expect(() =>
      TenantIsolationGuard.assertAccess(teamAPrincipal, teamBDevice),
    ).toThrow(ForbiddenError);
  });

  it("Attack Vector 5: Multi-tenant dataset filtering prevents data leakage", () => {
    const allResources: TenantResource[] = [
      { id: "s1", teamId: "team_alpha", type: "session" },
      { id: "s2", teamId: "team_beta", type: "session" },
      { id: "r1", teamId: "team_alpha", type: "recording" },
      { id: "r2", teamId: "team_beta", type: "recording" },
    ];

    const alphaView = TenantIsolationGuard.filterByTenant(
      teamAPrincipal,
      allResources,
    );
    expect(alphaView.length).toBe(2);
    expect(alphaView.every((r) => r.teamId === "team_alpha")).toBe(true);

    const betaView = TenantIsolationGuard.filterByTenant(
      teamBPrincipal,
      allResources,
    );
    expect(betaView.length).toBe(2);
    expect(betaView.every((r) => r.teamId === "team_beta")).toBe(true);
  });
});
