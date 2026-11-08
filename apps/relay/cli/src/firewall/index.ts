import process from "node:process";
import { FirewalldAdapter } from "./adapters/firewalld.js";
import { MacosFirewallAdapter } from "./adapters/macos.js";
import { NoneFirewallAdapter } from "./adapters/none.js";
import { UfwAdapter } from "./adapters/ufw.js";
import { WindowsFirewallAdapter } from "./adapters/windows.js";
import { defaultExecutor } from "./executor.js";
import type { CommandExecutor, FirewallAdapter, PortStatus } from "./types.js";

export * from "./types.js";

/**
 * Resolves the appropriate firewall adapter for the current host environment.
 */
export async function resolveFirewallAdapter(
  platform = process.platform,
  exec: CommandExecutor = defaultExecutor,
): Promise<FirewallAdapter> {
  if (platform === "win32") {
    const win = new WindowsFirewallAdapter(exec);
    if (await win.isAvailable()) return win;
  }

  if (platform === "darwin") {
    const mac = new MacosFirewallAdapter(exec);
    if (await mac.isAvailable()) return mac;
  }

  if (platform === "linux") {
    const ufw = new UfwAdapter(exec);
    if (await ufw.isAvailable()) return ufw;

    const firewalld = new FirewalldAdapter(exec);
    if (await firewalld.isAvailable()) return firewalld;
  }

  return new NoneFirewallAdapter();
}

export interface FirewallPortCheckResult {
  adapter: FirewallAdapter;
  firewallActive: boolean;
  portStatus: PortStatus;
  remediationCommand: string;
}

/**
 * Audits whether the local firewall is blocking the specified gateway port.
 */
export async function auditGatewayPortFirewall(
  port: number,
  adapter?: FirewallAdapter,
): Promise<FirewallPortCheckResult> {
  const activeAdapter = adapter ?? (await resolveFirewallAdapter());
  const firewallActive = await activeAdapter.isActive();

  if (!firewallActive) {
    return {
      adapter: activeAdapter,
      firewallActive: false,
      portStatus: "allowed",
      remediationCommand: "",
    };
  }

  const portStatus = await activeAdapter.checkPort(port);
  const remediationCommand =
    portStatus === "blocked" ? activeAdapter.getRemediationCommand(port) : "";

  return {
    adapter: activeAdapter,
    firewallActive: true,
    portStatus,
    remediationCommand,
  };
}
