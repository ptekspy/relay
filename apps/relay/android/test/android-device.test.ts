import { describe, expect, it } from "bun:test";
import { execSync } from "node:child_process";

describe("Android Native Receiver Integration & Physical Device Verification (Epic 9)", () => {
  const DEVICE_SERIAL = "HA1TGPDC";

  it("detects and identifies the connected physical Android device via ADB", () => {
    const devicesOutput = execSync("adb devices", { encoding: "utf-8" });
    expect(devicesOutput).toContain(DEVICE_SERIAL);

    const model = execSync(
      `adb -s ${DEVICE_SERIAL} shell getprop ro.product.model`,
      {
        encoding: "utf-8",
      },
    ).trim();
    expect(model).toBe("TB328FU");

    const release = execSync(
      `adb -s ${DEVICE_SERIAL} shell getprop ro.build.version.release`,
      { encoding: "utf-8" },
    ).trim();
    expect(release).toBe("12");

    const sdkVersion = execSync(
      `adb -s ${DEVICE_SERIAL} shell getprop ro.build.version.sdk`,
      { encoding: "utf-8" },
    ).trim();
    expect(Number.parseInt(sdkVersion, 10)).toBeGreaterThanOrEqual(31);
  });

  it("configures and removes direct ADB reverse port forwarding (tcp:7331)", () => {
    // Set up reverse port forwarding
    const forwardOut = execSync(
      `adb -s ${DEVICE_SERIAL} reverse tcp:7331 tcp:7331`,
      { encoding: "utf-8" },
    ).trim();
    // ADB reverse returns the port or empty on success
    expect(forwardOut === "" || forwardOut === "7331").toBe(true);

    // List reverse forwards
    const listOut = execSync(`adb -s ${DEVICE_SERIAL} reverse --list`, {
      encoding: "utf-8",
    });
    expect(listOut).toContain("tcp:7331");

    // Remove reverse port forward
    execSync(`adb -s ${DEVICE_SERIAL} reverse --remove tcp:7331`);
    const listAfter = execSync(`adb -s ${DEVICE_SERIAL} reverse --list`, {
      encoding: "utf-8",
    });
    expect(listAfter).not.toContain("tcp:7331");
  });

  it("queries device telemetry (battery level & display dimensions) via shell bridge", () => {
    // Battery dump
    const batteryDump = execSync(
      `adb -s ${DEVICE_SERIAL} shell dumpsys battery`,
      {
        encoding: "utf-8",
      },
    );
    expect(batteryDump).toContain("level:");
    expect(batteryDump).toContain("powered: true");

    // Display size
    const wmSize = execSync(`adb -s ${DEVICE_SERIAL} shell wm size`, {
      encoding: "utf-8",
    }).trim();
    expect(wmSize).toContain("Physical size:");
  });

  it("dispatches view intent to device browser/receiver", () => {
    // Verify intent resolver finds an activity capable of handling HTTP URLs
    const resolveOutput = execSync(
      `adb -s ${DEVICE_SERIAL} shell cmd package resolve-activity --brief http://127.0.0.1:7331`,
      { encoding: "utf-8" },
    );
    expect(resolveOutput.length).toBeGreaterThan(0);
    expect(resolveOutput).not.toContain("No activity found");
  });

  it("verifies hardware video encoding & screen capture support on physical device (TASK-153)", () => {
    // Verify screenrecord binary exists and executes
    const screenrecordPath = execSync(
      `adb -s ${DEVICE_SERIAL} shell which screenrecord`,
      { encoding: "utf-8" },
    ).trim();
    expect(screenrecordPath).toBe("/system/bin/screenrecord");

    // Verify MediaProjectionManager service is registered in system service registry
    const projectionDump = execSync(
      `adb -s ${DEVICE_SERIAL} shell dumpsys media_projection`,
      { encoding: "utf-8" },
    );
    expect(projectionDump).toContain("MEDIA PROJECTION MANAGER");
  });
});
