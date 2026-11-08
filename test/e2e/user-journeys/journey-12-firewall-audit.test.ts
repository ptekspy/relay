import { describe, expect, it } from "bun:test";
import { FirewalldAdapter } from "../../../apps/relay/cli/src/firewall/adapters/firewalld.js";
import { MacosFirewallAdapter } from "../../../apps/relay/cli/src/firewall/adapters/macos.js";
import { UfwAdapter } from "../../../apps/relay/cli/src/firewall/adapters/ufw.js";
import { WindowsFirewallAdapter } from "../../../apps/relay/cli/src/firewall/adapters/windows.js";
import type { CommandExecutor } from "../../../apps/relay/cli/src/firewall/types.js";

describe("Journey 12: Firewall Port Audit & Detection Simulation", () => {
  it("audits Linux UFW firewall rules, detects blocked ports, and generates remediation syntax", async () => {
    const mockUfwExec: CommandExecutor = async (_file, args) => {
      if (args[0] === "status") {
        return {
          stdout:
            "Status: active\nTo Action From\n-- ------ ----\n22/tcp ALLOW Anywhere\n7331/tcp ALLOW Anywhere\n",
          stderr: "",
          exitCode: 0,
        };
      }
      return { stdout: "", stderr: "", exitCode: 0 };
    };

    const ufw = new UfwAdapter(mockUfwExec);
    ufw.isActive = async () => true;

    expect(await ufw.checkPort(7331)).toBe("allowed");
    expect(await ufw.checkPort(7332)).toBe("blocked");

    const remediation = ufw.getRemediationCommand(7332);
    expect(remediation).toBe("sudo ufw allow 7332/tcp comment 'Relay Gateway'");
  });

  it("audits Linux Firewalld rules and generates permanent reload remediation syntax", async () => {
    const mockFirewalldExec: CommandExecutor = async (_file, args) => {
      if (args.includes("--query-port=7331/tcp")) {
        return { stdout: "yes\n", stderr: "", exitCode: 0 };
      }
      if (args.includes("--query-port=7332/tcp")) {
        return { stdout: "no\n", stderr: "", exitCode: 1 };
      }
      return { stdout: "", stderr: "", exitCode: 0 };
    };

    const firewalld = new FirewalldAdapter(mockFirewalldExec);
    firewalld.isActive = async () => true;

    expect(await firewalld.checkPort(7331)).toBe("allowed");
    expect(await firewalld.checkPort(7332)).toBe("blocked");

    const remediation = firewalld.getRemediationCommand(7332);
    expect(remediation).toBe("sudo firewall-cmd --add-port=7332/tcp");
  });

  it("audits macOS Application Firewall global state gracefully", async () => {
    const mockMacosExec: CommandExecutor = async (_file, args) => {
      if (args[0] === "--getglobalstate") {
        return {
          stdout: "Firewall is enabled. (State = 1)\n",
          stderr: "",
          exitCode: 0,
        };
      }
      return { stdout: "", stderr: "", exitCode: 0 };
    };

    const macos = new MacosFirewallAdapter(mockMacosExec);
    expect(await macos.isActive()).toBe(true);
    expect(await macos.checkPort(7331)).toBe("unknown");
  });

  it("audits Windows Firewall profiles and generates elevated PowerShell remediation syntax", async () => {
    const mockWinExec: CommandExecutor = async (_file, args) => {
      if (args[1] === "show" && args[2] === "allprofiles") {
        return {
          stdout: "Domain Profile Settings:\nState ON\n",
          stderr: "",
          exitCode: 0,
        };
      }
      if (args[4] === "name=Relay Gateway 7331") {
        return {
          stdout: "Rule Name: Relay Gateway 7331\nAction: Allow\n",
          stderr: "",
          exitCode: 0,
        };
      }
      if (args[4] === "name=Relay Gateway 7332") {
        return {
          stdout: "No rules match the specified criteria.\n",
          stderr: "",
          exitCode: 1,
        };
      }
      return { stdout: "", stderr: "", exitCode: 0 };
    };

    const win = new WindowsFirewallAdapter(mockWinExec);
    win.isActive = async () => true;

    expect(await win.checkPort(7331)).toBe("allowed");
    const remediation = win.getRemediationCommand(7332);
    expect(remediation).toContain("netsh advfirewall firewall add rule");
    expect(remediation).toContain("localport=7332");

    let executedCommand = "";
    const mockElevatedExec: CommandExecutor = async (file, args) => {
      executedCommand = `${file} ${args.join(" ")}`;
      return { stdout: "", stderr: "", exitCode: 0 };
    };
    const winElevated = new WindowsFirewallAdapter(mockElevatedExec);
    const result = await winElevated.allowPort(7332);
    expect(result.success).toBe(true);
    expect(executedCommand).toContain("powershell");
    expect(executedCommand).toContain("-Verb RunAs");
  });
});
