import type { CommandExecutor, FirewallAdapter, PortStatus } from "../types.js";

export class WindowsFirewallAdapter implements FirewallAdapter {
  readonly name = "Windows Defender Firewall";
  readonly type = "windows" as const;

  constructor(private readonly exec: CommandExecutor) {}

  async isAvailable(): Promise<boolean> {
    const res = await this.exec("where", ["netsh.exe"]);
    return res.exitCode === 0;
  }

  async isActive(): Promise<boolean> {
    const res = await this.exec("netsh", [
      "advfirewall",
      "show",
      "allprofiles",
      "state",
    ]);

    if (res.exitCode === 0) {
      return /State\s+ON/i.test(res.stdout);
    }

    return false;
  }

  async checkPort(port: number): Promise<PortStatus> {
    const active = await this.isActive();
    if (!active) {
      return "allowed";
    }

    const ruleName = `Relay Gateway ${port}`;
    const res = await this.exec("netsh", [
      "advfirewall",
      "firewall",
      "show",
      "rule",
      `name=${ruleName}`,
    ]);

    if (res.exitCode === 0 && /Action:\s+Allow/i.test(res.stdout)) {
      return "allowed";
    }

    // Also check via generic port query if PowerShell is available
    const psRes = await this.exec("powershell", [
      "-NoProfile",
      "-Command",
      `Get-NetFirewallPortFilter | Where-Object { $_.LocalPort -eq '${port}' }`,
    ]);

    if (psRes.exitCode === 0 && psRes.stdout.trim().length > 0) {
      return "allowed";
    }

    return "blocked";
  }

  getRemediationCommand(port: number): string {
    return `netsh advfirewall firewall add rule name="Relay Gateway ${port}" dir=in action=allow protocol=TCP localport=${port}`;
  }

  async allowPort(
    port: number,
  ): Promise<{ success: boolean; message: string }> {
    const args = [
      "-NoProfile",
      "-Command",
      `Start-Process netsh -ArgumentList 'advfirewall firewall add rule name="Relay Gateway ${port}" dir=in action=allow protocol=TCP localport=${port}' -Verb RunAs -Wait`,
    ];

    const res = await this.exec("powershell", args);
    if (res.exitCode === 0) {
      return {
        success: true,
        message: `Configured Windows Firewall rule for TCP port ${port}`,
      };
    }

    return {
      success: false,
      message: res.stderr || res.stdout || "Failed to elevate netsh command",
    };
  }
}
