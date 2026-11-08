import { describe, expect, it } from "bun:test";
import { InviteLifecycleManager } from "../src/auth/invite-lifecycle.js";

describe("TASK-163: Expired & Revoked Invitation Lifecycle Manager", () => {
  it("enforces configurable durations for created invitations", () => {
    const manager = new InviteLifecycleManager();

    const inv1h = manager.createInvite({
      sessionId: "sess-1",
      creatorId: "user-alice",
      duration: "1h",
    });
    expect(inv1h.expiresAt - inv1h.createdAt).toBe(3600 * 1000);

    const inv7d = manager.createInvite({
      sessionId: "sess-1",
      creatorId: "user-alice",
      duration: "7d",
    });
    expect(inv7d.expiresAt - inv7d.createdAt).toBe(7 * 24 * 3600 * 1000);
  });

  it("enforces single-use consumption and exhaustion", () => {
    const manager = new InviteLifecycleManager();
    const singleUse = manager.createInvite({
      sessionId: "sess-2",
      creatorId: "user-bob",
      type: "single-use",
    });

    // First consumption succeeds
    const firstAttempt = manager.validateAndConsume(singleUse.token);
    expect(firstAttempt.valid).toBe(true);
    expect(firstAttempt.status).toBe("active");

    // Second consumption fails with exhausted status
    const secondAttempt = manager.validateAndConsume(singleUse.token);
    expect(secondAttempt.valid).toBe(false);
    expect(secondAttempt.status).toBe("exhausted");
    expect(secondAttempt.reason).toContain("already been consumed");
  });

  it("rejects expired invitations with clear reason", () => {
    const manager = new InviteLifecycleManager();
    const invite = manager.createInvite({
      sessionId: "sess-3",
      creatorId: "user-charlie",
      duration: "1h",
    });

    const simulatedNow = invite.expiresAt + 1000;
    const res = manager.validateAndConsume(invite.id, simulatedNow);

    expect(res.valid).toBe(false);
    expect(res.status).toBe("expired");
    expect(res.reason).toContain("expired");
  });

  it("revokes active invitations immediately", () => {
    const manager = new InviteLifecycleManager();
    const invite = manager.createInvite({
      sessionId: "sess-4",
      creatorId: "user-owner",
    });

    expect(manager.getActiveInvitesForSession("sess-4").length).toBe(1);

    const revoked = manager.revokeInvite(invite.id, "admin-dave");
    expect(revoked).toBe(true);

    const check = manager.validateAndConsume(invite.id);
    expect(check.valid).toBe(false);
    expect(check.status).toBe("revoked");
    expect(check.reason).toContain("admin-dave");

    expect(manager.getActiveInvitesForSession("sess-4").length).toBe(0);
  });
});
