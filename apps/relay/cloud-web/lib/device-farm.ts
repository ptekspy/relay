/**
 * Team Shared Device Farm Inventory & Availability Tracker
 *
 * Tracks physical test devices registered across team members,
 * managing exclusivity locks so no two engineers control the same physical device concurrently.
 *
 * Note for Octavia: Used by the Device Farm management panel in Cloud Web.
 */

export type DevicePlatform = "android" | "web" | "desktop";
export type FarmDeviceStatus = "available" | "in-use" | "offline";

export interface DeviceFarmUser {
  userId: string;
  name: string;
  acquiredAt: number;
}

export interface SharedFarmDevice {
  id: string;
  name: string;
  platform: DevicePlatform;
  osVersion: string;
  batteryLevel: number; // 0 - 100
  isCharging: boolean;
  status: FarmDeviceStatus;
  currentUser?: DeviceFarmUser;
  lastHeartbeatAt: number;
}

export class DeviceFarmManager {
  private devices = new Map<string, SharedFarmDevice>();

  public registerDevice(device: SharedFarmDevice): void {
    this.devices.set(device.id, { ...device });
  }

  public getDevices(): SharedFarmDevice[] {
    return Array.from(this.devices.values());
  }

  public getDevice(deviceId: string): SharedFarmDevice | null {
    return this.devices.get(deviceId) ?? null;
  }

  public acquireDevice(
    deviceId: string,
    user: { userId: string; name: string },
  ): { success: boolean; error?: string } {
    const device = this.devices.get(deviceId);
    if (!device) {
      return { success: false, error: "Device not found" };
    }

    if (device.status === "offline") {
      return { success: false, error: "Device is currently offline" };
    }

    if (
      device.status === "in-use" &&
      device.currentUser?.userId !== user.userId
    ) {
      return {
        success: false,
        error: `Device is currently locked by ${device.currentUser?.name ?? "another engineer"}`,
      };
    }

    device.status = "in-use";
    device.currentUser = {
      userId: user.userId,
      name: user.name,
      acquiredAt: Date.now(),
    };

    return { success: true };
  }

  public releaseDevice(deviceId: string, userId: string): boolean {
    const device = this.devices.get(deviceId);
    if (!device) return false;

    // Only current user or admin can release
    if (device.currentUser && device.currentUser.userId !== userId) {
      return false;
    }

    device.status = "available";
    device.currentUser = undefined;
    return true;
  }

  public updateHeartbeat(
    deviceId: string,
    batteryLevel: number,
    isCharging: boolean,
  ): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.batteryLevel = Math.max(0, Math.min(100, batteryLevel));
      device.isCharging = isCharging;
      device.lastHeartbeatAt = Date.now();
      if (device.status === "offline") {
        device.status = "available";
      }
    }
  }
}
