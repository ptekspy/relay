import type { WindowLayoutState } from "./types.js";

/**
 * Manages native multi-window layouts, detached panels, and position restoration.
 */
export class WindowLayoutManager {
  private windows: Map<string, WindowLayoutState> = new Map();

  constructor() {
    // Default main window
    this.windows.set("main", {
      windowId: "main",
      type: "main",
      title: "Relay Desktop",
      width: 1400,
      height: 900,
      x: 100,
      y: 100,
      isDetached: false,
      focused: true,
    });
  }

  public getWindow(windowId: string): WindowLayoutState | undefined {
    return this.windows.get(windowId);
  }

  public getAllWindows(): WindowLayoutState[] {
    return Array.from(this.windows.values());
  }

  public detachPanel(
    panelType: "devtools" | "device-frame",
    title: string,
  ): WindowLayoutState {
    const windowId = `win-${panelType}-${Date.now()}`;
    const newState: WindowLayoutState = {
      windowId,
      type: panelType,
      title,
      width: 800,
      height: 700,
      x: 200,
      y: 150,
      isDetached: true,
      focused: true,
    };

    this.windows.set(windowId, newState);
    return newState;
  }

  public attachPanel(windowId: string): boolean {
    const win = this.windows.get(windowId);
    if (!win || !win.isDetached) return false;
    this.windows.delete(windowId);
    return true;
  }

  public updateWindowBounds(
    windowId: string,
    bounds: Partial<Pick<WindowLayoutState, "x" | "y" | "width" | "height">>,
  ): void {
    const win = this.windows.get(windowId);
    if (win) {
      Object.assign(win, bounds);
    }
  }
}
