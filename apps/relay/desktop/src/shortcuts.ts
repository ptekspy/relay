import type { KeyboardShortcutBinding } from "./types.js";

export const DEFAULT_SHORTCUTS: KeyboardShortcutBinding[] = [
  {
    key: "r",
    modifiers: ["Command"],
    action: "reload_all",
    description: "Reload all active receiver frames",
  },
  {
    key: "i",
    modifiers: ["Command", "Alt"],
    action: "toggle_devtools",
    description: "Toggle detached DevTools panel",
  },
  {
    key: "d",
    modifiers: ["Command", "Shift"],
    action: "add_viewport",
    description: "Add new simulated device viewport",
  },
];

export class KeyboardShortcutManager {
  private bindings: Map<string, KeyboardShortcutBinding> = new Map();

  constructor(initialBindings: KeyboardShortcutBinding[] = DEFAULT_SHORTCUTS) {
    for (const b of initialBindings) {
      this.bindings.set(this.formatKey(b), b);
    }
  }

  public registerShortcut(binding: KeyboardShortcutBinding): void {
    this.bindings.set(this.formatKey(binding), binding);
  }

  public matchShortcut(
    key: string,
    modifiers: Array<"Command" | "Control" | "Alt" | "Shift">,
  ): KeyboardShortcutBinding | undefined {
    const formatted = `${modifiers.sort().join("+")}+${key.toLowerCase()}`;
    return this.bindings.get(formatted);
  }

  public getAllBindings(): KeyboardShortcutBinding[] {
    return Array.from(this.bindings.values());
  }

  private formatKey(b: KeyboardShortcutBinding): string {
    return `${b.modifiers.slice().sort().join("+")}+${b.key.toLowerCase()}`;
  }
}
