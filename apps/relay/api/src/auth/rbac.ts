/**
 * Fine-Grained Team Roles (Owner, Admin, Engineer, Guest) & RBAC Enforcement
 *
 * Implements strict role boundaries:
 * - OWNER: billing, settings, full admin, kill switch, sessions, member management
 * - ADMIN: team members, sessions, recordings, kill switch (no billing)
 * - ENGINEER: create sessions, view sessions, device control, record
 * - GUEST: view-only access to invited sessions
 *
 * Note for Octavia: Used by API route guards and cloud-web navigation.
 */

export type TeamRole =
  | "OWNER"
  | "ADMIN"
  | "ENGINEER"
  | "GUEST"
  | "MEMBER" // alias for ENGINEER
  | "VIEWER"; // alias for GUEST

export type RelayPermission =
  | "relay:read"
  | "relay:write"
  | "relay:admin"
  | "relay:record"
  | "relay:kill"
  | "relay:billing"
  | "relay:members"
  | "relay:session:create"
  | "relay:session:view"
  | "relay:device:control";

export class ForbiddenError extends Error {
  public readonly statusCode = 403;
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

const ROLE_PERMISSIONS: Record<TeamRole, ReadonlySet<RelayPermission>> = {
  OWNER: new Set<RelayPermission>([
    "relay:read",
    "relay:write",
    "relay:admin",
    "relay:record",
    "relay:kill",
    "relay:billing",
    "relay:members",
    "relay:session:create",
    "relay:session:view",
    "relay:device:control",
  ]),
  ADMIN: new Set<RelayPermission>([
    "relay:read",
    "relay:write",
    "relay:admin",
    "relay:record",
    "relay:kill",
    "relay:members",
    "relay:session:create",
    "relay:session:view",
    "relay:device:control",
  ]),
  ENGINEER: new Set<RelayPermission>([
    "relay:read",
    "relay:write",
    "relay:record",
    "relay:session:create",
    "relay:session:view",
    "relay:device:control",
  ]),
  MEMBER: new Set<RelayPermission>([
    "relay:read",
    "relay:write",
    "relay:record",
    "relay:session:create",
    "relay:session:view",
    "relay:device:control",
  ]),
  GUEST: new Set<RelayPermission>(["relay:read", "relay:session:view"]),
  VIEWER: new Set<RelayPermission>(["relay:read", "relay:session:view"]),
};

export function hasPermission(
  role: TeamRole,
  permission: RelayPermission,
): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

export interface UserContext {
  userId: string;
  email: string;
  teamId: string;
  role: TeamRole;
}

export function assertPermission(
  context: UserContext,
  permission: RelayPermission,
): void {
  if (!hasPermission(context.role, permission)) {
    throw new ForbiddenError(
      `Access denied: user ${context.userId} with role ${context.role} lacks permission ${permission}`,
    );
  }
}
