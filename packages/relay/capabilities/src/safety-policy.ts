/**
 * Device Control Safety Policies & Host Permission Gates
 *
 * Enforces fine-grained permission controls over sensitive remote device capabilities
 * (GPS mocking, clipboard read/write, page reloading, synthetic form filling).
 * Allows the receiver user or host developer to lock down capabilities on demand.
 *
 * Note for Octavia: This powers the security shield toggle in the mobile HUD and Cloud Web settings.
 */

export type DeviceControlPermission =
  | "navigation"
  | "geolocation"
  | "orientation"
  | "network-throttle"
  | "clipboard"
  | "form-injection";

export interface DeviceControlPolicy {
  globalEnabled: boolean;
  permissions: Record<DeviceControlPermission, boolean>;
  requirePrompt: Record<DeviceControlPermission, boolean>;
}

export interface PermissionCheckResult {
  allowed: boolean;
  requiresPrompt: boolean;
  reason?: string;
}

export const DEFAULT_SAFETY_POLICY: DeviceControlPolicy = {
  globalEnabled: true,
  permissions: {
    navigation: true,
    geolocation: true,
    orientation: true,
    "network-throttle": true,
    clipboard: true,
    "form-injection": true,
  },
  requirePrompt: {
    navigation: false,
    geolocation: false,
    orientation: false,
    "network-throttle": false,
    clipboard: true, // Prompts before reading or overriding sensitive clipboard
    "form-injection": false,
  },
};

export class DeviceControlSafetyManager {
  private policy: DeviceControlPolicy;

  constructor(initialPolicy: Partial<DeviceControlPolicy> = {}) {
    this.policy = {
      globalEnabled:
        initialPolicy.globalEnabled ?? DEFAULT_SAFETY_POLICY.globalEnabled,
      permissions: {
        ...DEFAULT_SAFETY_POLICY.permissions,
        ...initialPolicy.permissions,
      },
      requirePrompt: {
        ...DEFAULT_SAFETY_POLICY.requirePrompt,
        ...initialPolicy.requirePrompt,
      },
    };
  }

  public getPolicy(): DeviceControlPolicy {
    return {
      globalEnabled: this.policy.globalEnabled,
      permissions: { ...this.policy.permissions },
      requirePrompt: { ...this.policy.requirePrompt },
    };
  }

  public setGlobalEnabled(enabled: boolean): void {
    this.policy.globalEnabled = enabled;
  }

  public setPermission(
    permission: DeviceControlPermission,
    allowed: boolean,
  ): void {
    this.policy.permissions[permission] = allowed;
  }

  public setRequirePrompt(
    permission: DeviceControlPermission,
    requirePrompt: boolean,
  ): void {
    this.policy.requirePrompt[permission] = requirePrompt;
  }

  public checkPermission(
    action: DeviceControlPermission,
  ): PermissionCheckResult {
    if (!this.policy.globalEnabled) {
      return {
        allowed: false,
        requiresPrompt: false,
        reason: "Remote device control is globally disabled by receiver user",
      };
    }

    const isPermitted = this.policy.permissions[action] ?? false;
    if (!isPermitted) {
      return {
        allowed: false,
        requiresPrompt: false,
        reason: `Remote control action '${action}' is not permitted by active safety policy`,
      };
    }

    const requiresPrompt = this.policy.requirePrompt[action] ?? false;
    return {
      allowed: true,
      requiresPrompt,
    };
  }
}
