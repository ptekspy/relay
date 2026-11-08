import type { CommandExecutor, FirewallAdapter, PortStatus } from "../types.js";

export class MacosFirewallAdapter implements FirewallAdapter {
  readonly name = "macOS Application Firewall";
  readonly type = "macos" as const;

  constructor(private readonly exec: CommandExecutor) {}

  async isAvailable(): Promise<boolean> {
    const res = await this.exec("test", [
      "-x",
      "/usr/libexec/ApplicationFirewall/socketfilterfw",
    ]);
    return res.exitCode === 0;
  }

  async isActive(): Promise<boolean> {
    const res = await this.exec(
      "/usr/libexec/ApplicationFirewall/socketfilterfw",
      ["--getglobalstate"],
    );

    if (res.exitCode === 0) {
      return /State\s*=\s*1/i.test(res.stdout) || /enabled/i.test(res.stdout);
    }

    return false;
  }

  async checkPort(_port: number): Promise<PortStatus> {
    const active = await this.isActive();
    if (!active) {
      return "allowed";
    }

    // macOS Application Firewall manages incoming connections per application binary
    // rather than numeric ports. If active, it will prompt the user when the binary listens on LAN.
    return "unknown";
  }

  getRemediationCommand(_port: number): string {
    return "sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off";
  }

  async allowPort(
    _port: number,
  ): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message:
        "On macOS, approve the network incoming connection prompt in System Settings > Network > Firewall",
    };
  }
}
