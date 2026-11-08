/**
 * @paddy-systems/relay-vscode
 * VS Code and Cursor Extension Controller.
 */

export * from "./commands.js";
export * from "./config-provider.js";
export * from "./cursor-context.js";
export * from "./port-detector.js";
export * from "./stack-mapper.js";
export * from "./status-bar.js";
export * from "./tree-provider.js";
export * from "./types.js";
export * from "./webview-panel.js";

import { RelayCommandRegistry } from "./commands.js";
import { RelayConfigurationProvider } from "./config-provider.js";
import { CursorAgentContextProvider } from "./cursor-context.js";
import { DevPortDetector } from "./port-detector.js";
import { RemoteStackMapper } from "./stack-mapper.js";
import { RelayStatusBarItem } from "./status-bar.js";
import { RelaySessionTreeProvider } from "./tree-provider.js";
import { RelayWebviewManager } from "./webview-panel.js";

export class RelayExtensionController {
  public tree = new RelaySessionTreeProvider();
  public webview = new RelayWebviewManager();
  public statusBar = new RelayStatusBarItem();
  public commands = new RelayCommandRegistry();
  public stackMapper = new RemoteStackMapper();
  public config = new RelayConfigurationProvider();
  public portDetector = new DevPortDetector();
  public cursorContext = new CursorAgentContextProvider();

  constructor() {
    this.registerDefaultCommands();
  }

  private registerDefaultCommands(): void {
    this.commands.registerCommand("relay.start", () => {
      this.statusBar.update(0, 0, this.config.get("defaultPort"));
      return { status: "started" };
    });

    this.commands.registerCommand("relay.stop", () => {
      this.statusBar.update(0, 0);
      this.tree.setSession(null);
      return { status: "stopped" };
    });
  }
}
