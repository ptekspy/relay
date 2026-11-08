import type { TuiCommandAction } from "./types.js";

export class TerminalCommandBar {
  private actions: TuiCommandAction[] = [
    { key: "r", label: "Reload Receivers", action: () => {} },
    { key: "q", label: "Quit", action: () => {} },
    { key: "c", label: "Clear Logs", action: () => {} },
    { key: "d", label: "Toggle DevTools", action: () => {} },
  ];

  constructor(customActions?: TuiCommandAction[]) {
    if (customActions) {
      this.actions = customActions;
    }
  }

  public renderBar(): string {
    const items = this.actions
      .map((a) => `[${a.key.toUpperCase()}] ${a.label}`)
      .join("   ");
    return `  ${items}`;
  }

  public handleKey(key: string): boolean {
    const match = this.actions.find(
      (a) => a.key.toLowerCase() === key.toLowerCase(),
    );
    if (match) {
      match.action();
      return true;
    }
    return false;
  }
}
