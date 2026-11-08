import { existsSync, readFileSync } from "node:fs";
import type { CommandExecutor, FirewallAdapter, PortStatus } from "../types.js";

export class UfwAdapter implements FirewallAdapter {
  readonly name = "Ubuntu Uncomplicated Firewall (UFW)";
  readonly type = "ufw" as const;

  constructor(private readonly exec: CommandExecutor) {}

  async isAvailable(): Promise<boolean> {
    if (existsSync("/etc/ufw/ufw.conf")) return true;
    const res = await this.exec("which", ["ufw"]);
    return res.exitCode === 0;
  }

  async isActive(): Promise<boolean> {
    try {
      if (existsSync("/etc/ufw/ufw.conf")) {
        const conf = readFileSync("/etc/ufw/ufw.conf", "utf8");
        if (/^ENABLED=yes/im.test(conf)) {
          return true;
        }
      }
    } catch {
      // Fall through to ufw command
    }

    const res = await this.exec("ufw", ["status"]);
    if (res.exitCode === 0 && res.stdout.includes("Status: active")) {
      return true;
    }

    return false;
  }

  async checkPort(port: number): Promise<PortStatus> {
    const active = await this.isActive();
    if (!active) {
      return "allowed";
    }

    // Attempt to inspect rules via ufw status
    const res = await this.exec("ufw", ["status"]);
    if (res.exitCode !== 0) {
      // Non-root or permission required to view rules, but firewall is active
      return "unknown";
    }

    const portPattern = new RegExp(`^${port}(/tcp)?\\s+ALLOW`, "im");
    const portAnywherePattern = new RegExp(
      `\\b${port}/tcp\\b.*\\bALLOW\\b`,
      "i",
    );

    if (portPattern.test(res.stdout) || portAnywherePattern.test(res.stdout)) {
      return "allowed";
    }

    return "blocked";
  }

  getRemediationCommand(port: number): string {
    return `sudo ufw allow ${port}/tcp comment 'Relay Gateway'`;
  }

  async allowPort(
    port: number,
  ): Promise<{ success: boolean; message: string }> {
    const res = await this.exec("sudo", [
      "ufw",
      "allow",
      `${port}/tcp`,
      "comment",
      "Relay Gateway",
    ]);

    if (res.exitCode === 0) {
      return {
        success: true,
        message: `Successfully allowed inbound TCP port ${port} in UFW`,
      };
    }

    return {
      success: false,
      message:
        res.stderr.trim() || res.stdout.trim() || "Failed to execute ufw allow",
    };
  }
}
