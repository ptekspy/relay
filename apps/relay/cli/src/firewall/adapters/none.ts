import type { FirewallAdapter, PortStatus } from "../types.js";

export class NoneFirewallAdapter implements FirewallAdapter {
  readonly name = "None / Inactive";
  readonly type = "none" as const;

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async isActive(): Promise<boolean> {
    return false;
  }

  async checkPort(_port: number): Promise<PortStatus> {
    return "allowed";
  }

  getRemediationCommand(_port: number): string {
    return "";
  }

  async allowPort(
    _port: number,
  ): Promise<{ success: boolean; message: string }> {
    return { success: true, message: "No active firewall" };
  }
}
