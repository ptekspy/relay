import { describe, expect, it } from "bun:test";
import { DeviceControlSafetyManager } from "../src/safety-policy.js";

describe("TASK-140: Device Control Safety Policies & Host Permission Gates", () => {
  it("allows standard permitted actions and identifies prompt requirements", () => {
    const manager = new DeviceControlSafetyManager();

    const navCheck = manager.checkPermission("navigation");
    expect(navCheck.allowed).toBe(true);
    expect(navCheck.requiresPrompt).toBe(false);

    // Clipboard prompts receiver by default
    const clipCheck = manager.checkPermission("clipboard");
    expect(clipCheck.allowed).toBe(true);
    expect(clipCheck.requiresPrompt).toBe(true);
  });

  it("blocks all actions when remote control is globally disabled by receiver user", () => {
    const manager = new DeviceControlSafetyManager();
    manager.setGlobalEnabled(false);

    const geoCheck = manager.checkPermission("geolocation");
    expect(geoCheck.allowed).toBe(false);
    expect(geoCheck.reason).toContain("globally disabled");
  });

  it("enforces granular permissions for individual device capabilities", () => {
    const manager = new DeviceControlSafetyManager();

    // Disable geolocation mocking
    manager.setPermission("geolocation", false);

    const geoCheck = manager.checkPermission("geolocation");
    expect(geoCheck.allowed).toBe(false);
    expect(geoCheck.reason).toContain("not permitted");

    // Form injection remains allowed
    const formCheck = manager.checkPermission("form-injection");
    expect(formCheck.allowed).toBe(true);

    // Re-enable geolocation
    manager.setPermission("geolocation", true);
    expect(manager.checkPermission("geolocation").allowed).toBe(true);
  });
});
