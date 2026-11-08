import { describe, expect, test } from "bun:test";
import {
  BrowserExtensionCompat,
  ContentScriptInjector,
  CspDevBypassEngine,
  DevToolsPanelBridge,
  ExtensionCoordinator,
  ExtensionPopupController,
  ServiceWorkerKeepaliveManager,
  StorageSyncBridge,
  UserAgentOverrideManager,
} from "../src/index.js";

describe("Relay Web Extension & DevTools Tests", () => {
  test("DevTools panel bridge creates panel and forwards messages", () => {
    const bridge = new DevToolsPanelBridge();
    expect(bridge.createPanel()).toBe(true);
    expect(bridge.isCreated()).toBe(true);

    let receivedMsg: unknown;
    const unsub = bridge.onMessage((msg) => {
      receivedMsg = msg;
    });

    bridge.postMessage({
      type: "inspect_element",
      payload: { selector: "#root" },
    });
    expect(receivedMsg).toBeDefined();

    unsub();
  });

  test("content script injector detects local dev servers", () => {
    const injector = new ContentScriptInjector();
    expect(injector.isDevServerUrl("http://localhost:3000")).toBe(true);
    expect(injector.isDevServerUrl("http://127.0.0.1:8080/app")).toBe(true);
    expect(injector.isDevServerUrl("http://192.168.1.50:5173")).toBe(true);
    expect(injector.isDevServerUrl("https://production.example.com")).toBe(
      false,
    );

    const banner = injector.generatePairingBannerHtml("123456");
    expect(banner).toContain("123456");
    expect(banner).toContain("relay-toast-banner");
  });

  test("popup controller updates state and renders markup", () => {
    const popup = new ExtensionPopupController();
    expect(popup.renderPopupHtml()).toContain(
      "No active local development server",
    );

    popup.updateSession({
      isDevServerDetected: true,
      shortCode: "ABC789",
      connectedReceiversCount: 3,
    });

    const activeHtml = popup.renderPopupHtml();
    expect(activeHtml).toContain("ABC789");
    expect(activeHtml).toContain("Connected Devices: <strong>3</strong>");
  });

  test("storage sync collects and serializes items", () => {
    const bridge = new StorageSyncBridge();
    bridge.syncItems([
      { key: "auth_token", value: "tok_123", area: "localStorage" },
      { key: "session_id", value: "sess_456", area: "cookie" },
    ]);

    expect(bridge.getItemsByArea("localStorage").length).toBe(1);
    expect(bridge.getItemsByArea("cookie").length).toBe(1);

    const serialized = bridge.serializeForReceiver();
    expect(serialized).toContain("auth_token");
  });

  test("UA override manager switches active presets", () => {
    const ua = new UserAgentOverrideManager();
    expect(ua.getActiveRule()).toBeUndefined();

    ua.enableRule(1);
    expect(ua.getActiveRule()?.name).toContain("iPhone 15");

    ua.disableAll();
    expect(ua.getActiveRule()).toBeUndefined();
  });

  test("CSP bypass relaxes headers only for dev origins", () => {
    const csp = new CspDevBypassEngine();
    expect(csp.shouldRelaxHeaders("http://localhost:3000")).toBe(false);

    csp.setEnabled(true);
    expect(csp.shouldRelaxHeaders("http://localhost:3000")).toBe(true);
    expect(csp.shouldRelaxHeaders("https://bank.example.com")).toBe(false);

    const relaxed = csp.relaxCspHeader(
      "default-src 'self'; script-src 'self';",
    );
    expect(relaxed).toContain("'unsafe-inline'");
    expect(relaxed).toContain("ws:");
  });

  test("service worker keepalive manages active pings", () => {
    const worker = new ServiceWorkerKeepaliveManager();
    worker.start();
    expect(worker.getIsAlive()).toBe(true);

    const pingResult = worker.ping();
    expect(pingResult.status).toBe("alive");

    worker.stop();
    expect(worker.getIsAlive()).toBe(false);
  });

  test("browser compat detects vendor strings", () => {
    expect(
      BrowserExtensionCompat.detectVendor("Mozilla/5.0 Firefox/120.0"),
    ).toBe("firefox");
    expect(BrowserExtensionCompat.detectVendor("Mozilla/5.0 Edg/120.0")).toBe(
      "edge",
    );
    expect(
      BrowserExtensionCompat.detectVendor(
        "Mozilla/5.0 Chrome/120.0 Safari/537.36",
      ),
    ).toBe("chrome");
  });

  test("ExtensionCoordinator lifecycle", () => {
    const coord = new ExtensionCoordinator();
    coord.initialize();
    expect(coord.worker.getIsAlive()).toBe(true);
    coord.shutdown();
    expect(coord.worker.getIsAlive()).toBe(false);
  });
});
