import { describe, expect, it } from "bun:test";
import {
  assertPermission,
  ForbiddenError,
  hasPermission,
} from "../src/auth/rbac.js";

describe("TASK-165: Fine-Grained Team Roles (Owner, Admin, Engineer, Guest)", () => {
  it("enforces OWNER role boundaries (billing + settings + full control)", () => {
    expect(hasPermission("OWNER", "relay:billing")).toBe(true);
    expect(hasPermission("OWNER", "relay:admin")).toBe(true);
    expect(hasPermission("OWNER", "relay:members")).toBe(true);
    expect(hasPermission("OWNER", "relay:session:create")).toBe(true);
  });

  it("enforces ADMIN role boundaries (members + admin, but strictly NO billing)", () => {
    expect(hasPermission("ADMIN", "relay:admin")).toBe(true);
    expect(hasPermission("ADMIN", "relay:members")).toBe(true);
    expect(hasPermission("ADMIN", "relay:kill")).toBe(true);
    expect(hasPermission("ADMIN", "relay:billing")).toBe(false);

    expect(() =>
      assertPermission(
        {
          userId: "usr_admin",
          email: "admin@corp.com",
          teamId: "team_1",
          role: "ADMIN",
        },
        "relay:billing",
      ),
    ).toThrow(ForbiddenError);
  });

  it("enforces ENGINEER role boundaries (sessions + device control, NO admin)", () => {
    expect(hasPermission("ENGINEER", "relay:session:create")).toBe(true);
    expect(hasPermission("ENGINEER", "relay:device:control")).toBe(true);
    expect(hasPermission("ENGINEER", "relay:record")).toBe(true);
    expect(hasPermission("ENGINEER", "relay:admin")).toBe(false);
    expect(hasPermission("ENGINEER", "relay:billing")).toBe(false);
    expect(hasPermission("ENGINEER", "relay:members")).toBe(false);
  });

  it("enforces GUEST role boundaries (view only, NO write or control)", () => {
    expect(hasPermission("GUEST", "relay:read")).toBe(true);
    expect(hasPermission("GUEST", "relay:session:view")).toBe(true);
    expect(hasPermission("GUEST", "relay:session:create")).toBe(false);
    expect(hasPermission("GUEST", "relay:device:control")).toBe(false);
    expect(hasPermission("GUEST", "relay:write")).toBe(false);

    try {
      assertPermission(
        {
          userId: "usr_guest",
          email: "guest@external.com",
          teamId: "team_1",
          role: "GUEST",
        },
        "relay:device:control",
      );
      expect(true).toBe(false); // should not reach
    } catch (err) {
      expect(err instanceof ForbiddenError).toBe(true);
      expect((err as ForbiddenError).statusCode).toBe(403);
    }
  });
});
