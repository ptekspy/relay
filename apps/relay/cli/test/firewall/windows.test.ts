import { describe, expect, it } from "bun:test";
import { WindowsFirewallAdapter } from "../../src/firewall/adapters/windows.js";
import type { CommandExecutor } from "../../src/firewall/types.js";

describe("WindowsFirewallAdapter", () => {
  it("detects active profiles", async () => {
    const mockExec: CommandExecutor = async (_file, args) => {
      if (args[1] === "show" && args[2] === "allprofiles") {
        return {
          stdout: `
Domain Profile Settings:
State                                 ON
Private Profile Settings:
State                                 ON
`,
          stderr: "",
          exitCode: 0,
        };
      }
      return { stdout: "", stderr: "", exitCode: 0 };
    };

    const adapter = new WindowsFirewallAdapter(mockExec);
    expect(await adapter.isActive()).toBe(true);
  });

  it("identifies rule existence via netsh and PowerShell", async () => {
    const mockExec: CommandExecutor = async (_file, args) => {
      if (args[0] === "advfirewall" && args[4] === "name=Relay Gateway 7331") {
        return {
          stdout:
            "Rule Name: Relay Gateway 7331\nAction: Allow\nDirection: In\n",
          stderr: "",
          exitCode: 0,
        };
      }
      if (args[0] === "advfirewall" && args[4] === "name=Relay Gateway 7332") {
        return {
          stdout: "No rules match the specified criteria.\n",
          stderr: "",
          exitCode: 1,
        };
      }
      if (args[0] === "-NoProfile" && args[2]?.includes("7332")) {
        return { stdout: "", stderr: "", exitCode: 0 };
      }
      return { stdout: "", stderr: "", exitCode: 0 };
    };

    const adapter = new WindowsFirewallAdapter(mockExec);
    adapter.isActive = async () => true;

    expect(await adapter.checkPort(7331)).toBe("allowed");
    expect(await adapter.checkPort(7332)).toBe("blocked");
    expect(adapter.getRemediationCommand(7332)).toContain("localport=7332");
  });

  it("generates elevated PowerShell remediation command", async () => {
    let psCall = "";
    const mockExec: CommandExecutor = async (file, args) => {
      psCall = `${file} ${args.join(" ")}`;
      return { stdout: "", stderr: "", exitCode: 0 };
    };

    const adapter = new WindowsFirewallAdapter(mockExec);
    const result = await adapter.allowPort(7332);
    expect(result.success).toBe(true);
    expect(psCall).toContain("Start-Process netsh");
    expect(psCall).toContain("-Verb RunAs");
    expect(psCall).toContain("localport=7332");
  });
});
