import { describe, expect, it } from "bun:test";
import {
  DeviceFarmManager,
  type SharedFarmDevice,
} from "../../../apps/relay/cloud-web/lib/device-farm.js";

describe("Journey 16: Shared Team Device Farm Exclusive Locking & Telemetry Verification", () => {
  const pixelDevice: SharedFarmDevice = {
    id: "dev-pixel-8",
    name: "Google Pixel 8 Pro",
    platform: "android",
    osVersion: "Android 14 (API 34)",
    batteryLevel: 85,
    isCharging: true,
    status: "available",
    lastHeartbeatAt: Date.now(),
  };

  const offlineTablet: SharedFarmDevice = {
    id: "dev-galaxy-tab",
    name: "Samsung Galaxy Tab S9",
    platform: "android",
    osVersion: "Android 13",
    batteryLevel: 12,
    isCharging: false,
    status: "offline",
    lastHeartbeatAt: Date.now() - 3600000,
  };

  it("manages exclusive single-engineer device locks, rejects conflicts, and tracks battery telemetry", () => {
    const manager = new DeviceFarmManager();
    manager.registerDevice(pixelDevice);
    manager.registerDevice(offlineTablet);

    expect(manager.getDevices().length).toBe(2);

    // 1. Engineer 1 (Octavia) acquires Pixel 8
    const acq1 = manager.acquireDevice("dev-pixel-8", {
      userId: "usr-octavia",
      name: "Octavia",
    });
    expect(acq1.success).toBe(true);

    const acquiredDevice = manager.getDevice("dev-pixel-8");
    expect(acquiredDevice?.status).toBe("in-use");
    expect(acquiredDevice?.currentUser?.name).toBe("Octavia");

    // 2. Engineer 2 (Sally) attempts to acquire already-locked Pixel 8
    const acq2 = manager.acquireDevice("dev-pixel-8", {
      userId: "usr-sally",
      name: "Sally Smith",
    });
    expect(acq2.success).toBe(false);
    expect(acq2.error).toContain("Device is currently locked by Octavia");

    // 3. Attempt to acquire offline device
    const acqOffline = manager.acquireDevice("dev-galaxy-tab", {
      userId: "usr-sally",
      name: "Sally Smith",
    });
    expect(acqOffline.success).toBe(false);
    expect(acqOffline.error).toContain("currently offline");

    // 4. Update device battery telemetry and charging state via heartbeat
    manager.updateHeartbeat("dev-pixel-8", 92, false);
    const updated = manager.getDevice("dev-pixel-8");
    expect(updated?.batteryLevel).toBe(92);
    expect(updated?.isCharging).toBe(false);

    // 5. Unauthorized release attempt by Sally fails
    const unauthorizedRelease = manager.releaseDevice(
      "dev-pixel-8",
      "usr-sally",
    );
    expect(unauthorizedRelease).toBe(false);
    expect(manager.getDevice("dev-pixel-8")?.status).toBe("in-use");

    // 6. Authorized release by Octavia succeeds
    const authorizedRelease = manager.releaseDevice(
      "dev-pixel-8",
      "usr-octavia",
    );
    expect(authorizedRelease).toBe(true);
    expect(manager.getDevice("dev-pixel-8")?.status).toBe("available");

    // 7. Sally can now acquire the freed device
    const acq3 = manager.acquireDevice("dev-pixel-8", {
      userId: "usr-sally",
      name: "Sally Smith",
    });
    expect(acq3.success).toBe(true);
    expect(manager.getDevice("dev-pixel-8")?.currentUser?.name).toBe(
      "Sally Smith",
    );
  });
});
