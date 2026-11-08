import { describe, expect, test } from "bun:test";
import {
  DesktopAppController,
  DesktopDiagnosticsCollector,
  DpiDisplayScaler,
  GatewayDiscoveryListener,
  KeyboardShortcutManager,
  LocalCertificateTrustManager,
  TrayStatusManager,
  ViewportMatrixManager,
  WindowLayoutManager,
} from "../src/index.js";

describe("Relay Desktop Application Shell Tests", () => {
  test("viewport matrix manages responsive devices and sync scrolling", () => {
    const manager = new ViewportMatrixManager();
    const viewports = manager.getActiveViewports();
    expect(viewports.length).toBeGreaterThanOrEqual(3);

    // Sync scroll calculation
    const targetScrollY = manager.calculateScrollSync(
      "iphone-15-pro",
      200,
      1000,
      "desktop-laptop",
      2000,
    );
    expect(targetScrollY).toBe(400);

    manager.setSyncScroll(false);
    expect(
      manager.calculateScrollSync(
        "iphone-15-pro",
        200,
        1000,
        "desktop-laptop",
        2000,
      ),
    ).toBe(0);
  });

  test("gateway discovery registers and sweeps stale beacons", () => {
    const discovery = new GatewayDiscoveryListener();
    let beaconCount = 0;
    const unsub = discovery.onBeaconsChanged((beacons) => {
      beaconCount = beacons.length;
    });

    discovery.registerBeacon({
      host: "127.0.0.1",
      port: 7331,
      sessionId: "sess-abc",
      devServerUrl: "http://localhost:3000",
      shortCode: "123456",
      discoveredAt: Date.now(),
    });

    expect(beaconCount).toBe(1);
    expect(discovery.getDiscoveredBeacons()[0]?.sessionId).toBe("sess-abc");

    unsub();
  });

  test("window manager detaches and attaches panels", () => {
    const winManager = new WindowLayoutManager();
    expect(winManager.getAllWindows().length).toBe(1);

    const detached = winManager.detachPanel("devtools", "DevTools Panel");
    expect(detached.isDetached).toBe(true);
    expect(winManager.getAllWindows().length).toBe(2);

    const attached = winManager.attachPanel(detached.windowId);
    expect(attached).toBe(true);
    expect(winManager.getAllWindows().length).toBe(1);
  });

  test("keyboard shortcuts match modifiers and keys", () => {
    const shortcuts = new KeyboardShortcutManager();
    const match = shortcuts.matchShortcut("r", ["Command"]);
    expect(match).toBeDefined();
    expect(match?.action).toBe("reload_all");

    const nonMatch = shortcuts.matchShortcut("z", ["Shift"]);
    expect(nonMatch).toBeUndefined();
  });

  test("DPI display scaler computes crisp scale factors", () => {
    const scaler = new DpiDisplayScaler();
    const factor = scaler.calculateScaleFactor(2, 800, 400);
    expect(factor).toBe(0.5);

    expect(scaler.getPixelDensityLabel(3)).toContain("Super Retina");
  });

  test("tray status manager updates badges and tooltips", () => {
    const tray = new TrayStatusManager();
    expect(tray.getTrayTooltip()).toContain("Disconnected");

    tray.updateStatus({
      health: "healthy",
      connectedReceiversCount: 2,
      latencyMs: 14,
    });

    expect(tray.getTrayTooltip()).toContain("2 device(s) connected (14ms)");
    expect(tray.getTrayBadge()).toBe("2");
    expect(tray.getHealthIconColor()).toBe("green");
  });

  test("certificate trust manager generates OS instructions", () => {
    const certs = new LocalCertificateTrustManager();
    expect(certs.generateInstallInstructions("macos")).toContain(
      "sudo security add-trusted-cert",
    );
    expect(certs.generateInstallInstructions("windows")).toContain(
      "certutil -addstore",
    );
    expect(certs.generateInstallInstructions("linux")).toContain(
      "update-ca-certificates",
    );

    certs.setTrustStatus(true);
    expect(certs.getCertStatus().isTrusted).toBe(true);
  });

  test("diagnostics collector handles ring buffer and serializes reports", () => {
    const diag = new DesktopDiagnosticsCollector();
    diag.log("Bootstrapped UI");
    const report = diag.generateReport();
    expect(report.recentLogs.length).toBe(1);
    expect(report.appVersion).toBe("0.1.0");

    const serialized = diag.serializeReport(report);
    expect(serialized).toContain("recentLogs");
  });

  test("DesktopAppController end-to-end lifecycle", () => {
    const controller = new DesktopAppController();
    expect(controller.viewports).toBeDefined();
    expect(controller.discovery).toBeDefined();
    expect(controller.windowManager).toBeDefined();

    controller.shutdown();
    expect(
      controller.diagnostics.getRecentLogs().length,
    ).toBeGreaterThanOrEqual(2);
  });
});
