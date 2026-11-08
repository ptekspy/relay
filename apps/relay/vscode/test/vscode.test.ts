import { describe, expect, test } from "bun:test";
import {
  CursorAgentContextProvider,
  DevPortDetector,
  RelayCommandRegistry,
  RelayConfigurationProvider,
  RelayExtensionController,
  RelaySessionTreeProvider,
  RelayStatusBarItem,
  RelayWebviewManager,
  RemoteStackMapper,
} from "../src/index.js";

describe("Relay VS Code / Cursor Extension Tests", () => {
  test("tree provider renders empty state and active session", () => {
    const tree = new RelaySessionTreeProvider();
    const emptyItems = tree.getTreeItems();
    expect(emptyItems[0]?.label).toContain("No Active Relay Session");

    tree.setSession({
      sessionId: "s1",
      localPort: 3000,
      shortCode: "123456",
      startedAt: Date.now(),
      receivers: [
        {
          id: "r1",
          name: "iPhone 15",
          category: "mobile",
          ipAddress: "192.168.1.100",
          latencyMs: 12,
          batteryLevel: 0.85,
        },
      ],
    });

    const activeItems = tree.getTreeItems();
    expect(activeItems[0]?.label).toContain("Port :3000 (123456)");
    expect(activeItems[0]?.children?.length).toBe(1);
    expect(activeItems[0]?.children?.[0]?.description).toContain("85% 🔋");
  });

  test("webview manager generates pairing markup", () => {
    const webview = new RelayWebviewManager();
    webview.show();
    expect(webview.getIsVisible()).toBe(true);

    const html = webview.renderWebviewHtml("456789", "https://relay.dev/pair");
    expect(html).toContain("456789");
    expect(html).toContain("https://relay.dev/pair");
  });

  test("status bar item reflects session and device states", () => {
    const bar = new RelayStatusBarItem();
    expect(bar.getText()).toContain("Relay: Off");

    bar.update(0, 0, 5173);
    expect(bar.getText()).toContain("Relay :5173 (0 devices)");

    bar.update(2, 18, 5173);
    expect(bar.getText()).toContain("Relay: 2 device(s) (18ms)");
  });

  test("command registry executes registered hooks", async () => {
    const registry = new RelayCommandRegistry();
    registry.registerCommand("relay.test", (val) => `Hello ${val}`);

    const res = await registry.executeCommand("relay.test", "World");
    expect(res).toBe("Hello World");
  });

  test("remote stack mapper maps browser URLs to local workspace paths", () => {
    const mapper = new RemoteStackMapper("/home/user/project");
    const trace = "    at App (http://localhost:3000/src/App.tsx:42:15)";
    const mapped = mapper.parseStackLine(trace);

    expect(mapped).not.toBeNull();
    expect(mapped?.originalFile).toBe("/home/user/project/src/App.tsx");
    expect(mapped?.lineNumber).toBe(42);
    expect(mapped?.columnNumber).toBe(15);
  });

  test("configuration provider manages settings", () => {
    const config = new RelayConfigurationProvider();
    expect(config.get("defaultPort")).toBe(3000);

    config.update({ defaultPort: 8080 });
    expect(config.get("defaultPort")).toBe(8080);
  });

  test("dev port detector recognizes common frameworks", () => {
    const detector = new DevPortDetector();
    expect(detector.detectFramework(5173)).toBe("Vite");
    expect(detector.detectFramework(3000)).toBe("Next.js / React");
    expect(detector.detectFramework(4321)).toBe("Astro");
  });

  test("Cursor context provider formats structured context", () => {
    const provider = new CursorAgentContextProvider();
    const prompt = provider.formatPromptContext(
      {
        sessionId: "s1",
        localPort: 3000,
        shortCode: "999888",
        startedAt: Date.now(),
        receivers: [
          {
            id: "rec1",
            name: "Pixel 8",
            category: "mobile",
            ipAddress: "192.168.1.105",
            latencyMs: 9,
            batteryLevel: 0.5,
          },
        ],
      },
      [{ message: "Uncaught TypeError: cannot read property of null" }],
    );

    expect(prompt).toContain("<relay_session_context>");
    expect(prompt).toContain("Pixel 8");
    expect(prompt).toContain("Uncaught TypeError");
  });

  test("RelayExtensionController lifecycle and commands", async () => {
    const controller = new RelayExtensionController();
    const startRes = await controller.commands.executeCommand("relay.start");
    expect(startRes).toEqual({ status: "started" });
    expect(controller.statusBar.getText()).toContain(":3000");

    const stopRes = await controller.commands.executeCommand("relay.stop");
    expect(stopRes).toEqual({ status: "stopped" });
    expect(controller.statusBar.getText()).toContain("Relay: Off");
  });
});
