/**
 * @paddy-systems/relay-cli-ui
 * Terminal UI Component Library.
 */

export * from "./accessibility.js";
export * from "./ansi-degrader.js";
export * from "./command-bar.js";
export * from "./device-table.js";
export * from "./histogram.js";
export * from "./layout-engine.js";
export * from "./log-stream.js";
export * from "./qr-renderer.js";
export * from "./types.js";

import { terminalAccessibilityHelper } from "./accessibility.js";
import { ansiColorDegrader } from "./ansi-degrader.js";
import { TerminalCommandBar } from "./command-bar.js";
import { terminalDeviceTable } from "./device-table.js";
import { terminalHistogramRenderer } from "./histogram.js";
import { terminalLayoutEngine } from "./layout-engine.js";
import { TerminalLogStream } from "./log-stream.js";
import { terminalQrRenderer } from "./qr-renderer.js";

export class RelayCliUiCoordinator {
  public qr = terminalQrRenderer;
  public table = terminalDeviceTable;
  public logStream = new TerminalLogStream();
  public commandBar = new TerminalCommandBar();
  public layout = terminalLayoutEngine;
  public histogram = terminalHistogramRenderer;
  public a11y = terminalAccessibilityHelper;
  public color = ansiColorDegrader;
}
