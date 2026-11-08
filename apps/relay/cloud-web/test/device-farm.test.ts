import { describe, expect, it } from "bun:test";
import { DeviceFarmManager, type SharedFarmDevice } from "../lib/device-farm";

describe("TASK-168: Team Shared Device Farm Inventory & Availability Tracker", () => {
  const mockPixel: SharedFarmDevice = {
    id: "dev-pixel-8",
    name: "Google Pixel 8",
    platform: "android",
    osVersion: "Android 14 (API 34)",
    batteryLevel: 85,
    isCharging: true,
    status: "available",
    lastHeartbeatAt: Date.now(),
  };

  it("registers devices and manages single-engineer exclusive locking", () => {
    const manager = new DeviceFarmManager();
    manager.registerDevice(mockPixel);

    // Engineer 1 acquires device
    const acq1 = manager.acquireDevice("dev-pixel-8", {
      userId: "usr-eng-1",
      name: "Octavia",
    });
    expect(acq1.success).toBe(true);

    const dev = manager.getDevice("dev-pixel-8");
    expect(dev?.status).toBe("in-use");
    expect(dev?.currentUser?.name).toBe("Octavia");

    // Engineer 2 attempts concurrent acquisition -> blocked
    const acq2 = manager.acquireDevice("dev-pixel-8", {
      userId: "usr-eng-2",
      name: "Sally Smith",
    });
    expect(acq2.success).toBe(false);
    expect(acq2.error).toContain("Octavia");

    // Engineer 1 releases device
    const released = manager.releaseDevice("dev-pixel-8", "usr-eng-1");
    expect(released).toBe(true);
    expect(manager.getDevice("dev-pixel-8")?.status).toBe("available");

    // Engineer 2 can now acquire
    const acq2Retry = manager.acquireDevice("dev-pixel-8", {
      userId: "usr-eng-2",
      name: "Sally Smith",
    });
    expect(acq2Retry.success).toBe(true);
  });

  it("prevents acquisition of offline devices", () => {
    const manager = new DeviceFarmManager();
    manager.registerDevice({
      ...mockPixel,
      id: "dev-offline-tab",
      status: "offline",
    });

    const res = manager.acquireDevice("dev-offline-tab", {
      userId: "usr-1",
      name: "Bob",
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain("offline");
  });

  it("updates battery telemetry and charging state on heartbeat", () => {
    const manager = new DeviceFarmManager();
    manager.registerDevice(mockPixel);

    manager.updateHeartbeat("dev-pixel-8", 92, false);

    const updated = manager.getDevice("dev-pixel-8");
    expect(updated?.batteryLevel).toBe(92);
    expect(updated?.isCharging).toBe(false);
  });
});
