import type { UserAgentOverrideRule } from "./types.js";

export const PRESET_OVERRIDE_RULES: UserAgentOverrideRule[] = [
  {
    id: 1,
    name: "iPhone 15 Mobile Safari",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iPhone",
    enabled: false,
  },
  {
    id: 2,
    name: "Pixel 8 Mobile Chrome",
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36",
    platform: "Linux armv8l",
    enabled: false,
  },
];

export class UserAgentOverrideManager {
  private rules: Map<number, UserAgentOverrideRule> = new Map();

  constructor(initialRules = PRESET_OVERRIDE_RULES) {
    for (const r of initialRules) {
      this.rules.set(r.id, { ...r });
    }
  }

  public enableRule(ruleId: number): void {
    for (const rule of this.rules.values()) {
      rule.enabled = rule.id === ruleId;
    }
  }

  public disableAll(): void {
    for (const rule of this.rules.values()) {
      rule.enabled = false;
    }
  }

  public getActiveRule(): UserAgentOverrideRule | undefined {
    return Array.from(this.rules.values()).find((r) => r.enabled);
  }

  public getRules(): UserAgentOverrideRule[] {
    return Array.from(this.rules.values());
  }
}
