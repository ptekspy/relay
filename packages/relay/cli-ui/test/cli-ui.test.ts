import { describe, expect, test } from "bun:test";
import {
  ansiColorDegrader,
  RelayCliUiCoordinator,
  TerminalCommandBar,
  TerminalLogStream,
  terminalAccessibilityHelper,
  terminalDeviceTable,
  terminalHistogramRenderer,
  terminalLayoutEngine,
  terminalQrRenderer,
} from "../src/index.js";

describe("Relay CLI UI Component Library Tests", () => {
  test("QR renderer produces half-block unicode matrices", () => {
    const mock = terminalQrRenderer.generateMockQr(6);
    const rendered = terminalQrRenderer.renderMatrix(mock);

    expect(rendered.length).toBeGreaterThan(0);
    expect(rendered).toMatch(/[█▀▄ ]/);

    const inverted = terminalQrRenderer.renderMatrix(mock, true);
    expect(inverted.length).toBeGreaterThan(0);
  });

  test("device table formats rows and renders sparklines", () => {
    const empty = terminalDeviceTable.renderTable([]);
    expect(empty).toContain("No devices connected");

    const table = terminalDeviceTable.renderTable([
      {
        id: "d1",
        name: "iPhone 15 Pro",
        platform: "ios",
        status: "connected",
        latencyMs: 14,
        batteryPercent: 92,
        fps: 60,
      },
    ]);

    expect(table).toContain("iPhone 15 Pro");
    expect(table).toContain("IOS");
    expect(table).toContain("● Connected");
    expect(table).toContain("14ms");
    expect(table).toContain("92%");

    const sparkline = terminalDeviceTable.renderSparkline([
      10, 20, 50, 80, 100,
    ]);
    expect(sparkline.length).toBe(5);
  });

  test("log stream appends and filters by level", () => {
    const stream = new TerminalLogStream();
    stream.append({
      id: "1",
      timestamp: Date.now(),
      level: "info",
      tag: "Tunnel",
      message: "Tunnel opened on :7331",
    });
    stream.append({
      id: "2",
      timestamp: Date.now(),
      level: "error",
      tag: "WS",
      message: "Handshake failed",
    });

    expect(stream.getCount()).toBe(2);

    const allLogs = stream.renderWindow(10);
    expect(allLogs).toContain("[INFO]");
    expect(allLogs).toContain("[ERROR]");

    const errorOnly = stream.renderWindow(10, "error");
    expect(errorOnly).toContain("[ERROR]");
    expect(errorOnly).not.toContain("[INFO]");
  });

  test("command bar executes matched action handlers", () => {
    let reloaded = false;
    const bar = new TerminalCommandBar([
      {
        key: "r",
        label: "Reload",
        action: () => {
          reloaded = true;
        },
      },
      { key: "q", label: "Quit", action: () => {} },
    ]);

    const rendered = bar.renderBar();
    expect(rendered).toContain("[R] Reload");
    expect(rendered).toContain("[Q] Quit");

    const handled = bar.handleKey("r");
    expect(handled).toBe(true);
    expect(reloaded).toBe(true);

    const unhandled = bar.handleKey("z");
    expect(unhandled).toBe(false);
  });

  test("layout engine adapts to terminal dimensions", () => {
    const compact = terminalLayoutEngine.calculateLayout({
      columns: 70,
      rows: 18,
    });
    expect(compact.mode).toBe("compact");
    expect(compact.showDeviceTable).toBe(false);

    const standard = terminalLayoutEngine.calculateLayout({
      columns: 100,
      rows: 25,
    });
    expect(standard.mode).toBe("standard");
    expect(standard.showDeviceTable).toBe(true);

    const wide = terminalLayoutEngine.calculateLayout({
      columns: 140,
      rows: 40,
    });
    expect(wide.mode).toBe("widescreen");
  });

  test("histogram renderer displays proportional bars", () => {
    const hist = terminalHistogramRenderer.renderHistogram([
      { label: "< 20ms", count: 10 },
      { label: "20-50ms", count: 5 },
      { label: "> 50ms", count: 1 },
    ]);

    expect(hist).toContain("< 20ms");
    expect(hist).toContain("(10)");
    expect(hist).toContain("█");
  });

  test("accessibility helper strips ANSI and formats plain text", () => {
    const ansi = "\x1b[31mError\x1b[0m: connection lost";
    expect(terminalAccessibilityHelper.stripAnsi(ansi)).toBe(
      "Error: connection lost",
    );

    const summary = terminalAccessibilityHelper.generateScreenReaderSummary({
      shortCode: "123456",
      port: 3000,
      connectedDevices: 2,
      avgLatencyMs: 15,
    });

    expect(summary).toContain("Pairing Short Code: 123456");
    expect(summary).toContain("15 milliseconds");
  });

  test("ANSI degrader respects color modes", () => {
    const mono = ansiColorDegrader.colorize("Hello", "#3b82f6", "monochrome");
    expect(mono).toBe("Hello");

    const truecolor = ansiColorDegrader.colorize(
      "Hello",
      "#3b82f6",
      "truecolor",
    );
    expect(truecolor).toContain("\x1b[38;2;");

    const mode256 = ansiColorDegrader.colorize("Hello", "#3b82f6", "256color");
    expect(mode256).toContain("\x1b[38;5;");
  });

  test("RelayCliUiCoordinator facade", () => {
    const coord = new RelayCliUiCoordinator();
    expect(coord.qr).toBeDefined();
    expect(coord.table).toBeDefined();
    expect(coord.logStream).toBeDefined();
    expect(coord.commandBar).toBeDefined();
  });
});
