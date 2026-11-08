import { describe, expect, it } from "bun:test";
import { MacosFirewallAdapter } from "../../src/firewall/adapters/macos.js";
import type { CommandExecutor } from "../../src/firewall/types.js";

describe("MacosFirewallAdapter", () => {
  it("detects socketfilterfw state", async () => {
    const mockExec: CommandExecutor = async (_file, args) => {
      if (args[0] === "--getglobalstate") {
        return {
          stdout: "Firewall is enabled. (State = 1)\n",
          stderr: "",
          exitCode: 0,
        };
      }
      return { stdout: "", stderr: "", exitCode: 0 };
    };

    const adapter = new MacosFirewallAdapter(mockExec);
    expect(await adapter.isActive()).toBe(true);
  });

  it("handles application-level checking gracefully", async () => {
    const mockExec: CommandExecutor = async () => ({
      stdout: "",
      stderr: "",
      exitCode: 0,
    });

    const adapter = new MacosFirewallAdapter(mockExec);
    adapter.isActive = async () => true;

    const status = await adapter.checkPort(7331);
    expect(status).toBe("unknown");
  });
});
