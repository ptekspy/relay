import { ForbiddenError } from "./rbac.js";

/**
 * Tenant Isolation Guard & Cross-Tenant Boundary Enforcement
 *
 * Ensures multi-tenant isolation across sessions, recordings, devices, and invites.
 * Strenuously prevents any team from inspecting, mutating, or joining another team's resources.
 *
 * Note for Octavia: Used in the API middleware pipeline across all tenant-scoped routes.
 */

export interface TenantResource {
  id: string;
  teamId: string;
  type: "session" | "recording" | "invite" | "device";
}

export interface SecurityPrincipal {
  userId: string;
  teamId: string;
  role: string;
}

export class TenantIsolationGuard {
  public static assertAccess(
    principal: SecurityPrincipal,
    resource: TenantResource,
  ): void {
    if (principal.teamId !== resource.teamId) {
      throw new ForbiddenError(
        `Cross-tenant access violation: principal ${principal.userId} (team: ${principal.teamId}) cannot access ${resource.type} ${resource.id} (team: ${resource.teamId})`,
      );
    }
  }

  public static filterByTenant<T extends TenantResource>(
    principal: SecurityPrincipal,
    resources: readonly T[],
  ): T[] {
    return resources.filter((r) => r.teamId === principal.teamId);
  }
}
