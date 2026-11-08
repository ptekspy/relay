import { existsSync } from "node:fs";
import type { CommandExecutor, FirewallAdapter, PortStatus } from "../types.js";

export class FirewalldAdapter implements FirewallAdapter {
  readonly name = "firewalld (Fedora / RHEL)";
  readonly type = "firewalld" as const;

  constructor(private readonly exec: CommandExecutor) {}

  async isAvailable(): Promise<boolean> {
    if (
      existsSync("/usr/bin/firewall-cmd") ||
      existsSync("/usr/sbin/firewall-cmd")
    ) {
      return true;
    }
    const res = await this.exec("which", ["firewall-cmd"]);
    return res.exitCode === 0;
  }

  async isActive(): Promise<boolean> {
    const res = await this.exec("firewall-cmd", ["--state"]);
    return res.exitCode === 0 && res.stdout.trim() === "running";
  }

  async checkPort(port: number): Promise<PortStatus> {
    const active = await this.isActive();
    if (!active) {
      return "allowed";
    }

    const res = await this.exec("firewall-cmd", [`--query-port=${port}/tcp`]);

    if (res.exitCode === 0 && res.stdout.trim() === "yes") {
      return "allowed";
    }

    if (res.exitCode === 1 && res.stdout.trim() === "no") {
      return "blocked";
    }

    return "unknown";
  }

  getRemediationCommand(port: number): string {
    return `sudo firewall-cmd --add-port=${port}/tcp`;
  }

  async allowPort(
    port: number,
  ): Promise<{ success: boolean; message: string }> {
    const res = await this.exec("sudo", [
      "firewall-cmd",
      `--add-port=${port}/tcp`,
    ]);

    if (res.exitCode === 0) {
      return {
        success: true,
        message: `Successfully allowed port ${port}/tcp in firewalld`,
      };
    }

    return {
      success: false,
      message:
        res.stderr.trim() ||
        res.stdout.trim() ||
        "Failed to execute firewall-cmd",
    };
  }
}
