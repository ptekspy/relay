import { describe, expect, it } from "bun:test";
import { FirewalldAdapter } from "../../src/firewall/adapters/firewalld.js";
import type { CommandExecutor } from "../../src/firewall/types.js";

describe("FirewalldAdapter", () => {
  it("detects running firewalld state", async () => {
    const mockExec: CommandExecutor = async (_file, args) => {
      if (args[0] === "--state") {
        return { stdout: "running\n", stderr: "", exitCode: 0 };
      }
      return { stdout: "", stderr: "", exitCode: 0 };
    };

    const adapter = new FirewalldAdapter(mockExec);
    expect(await adapter.isActive()).toBe(true);
  });

  it("identifies port status via query-port", async () => {
    const mockExec: CommandExecutor = async (_file, args) => {
      if (args[0] === "--query-port=7331/tcp") {
        return { stdout: "yes\n", stderr: "", exitCode: 0 };
      }
      if (args[0] === "--query-port=7332/tcp") {
        return { stdout: "no\n", stderr: "", exitCode: 1 };
      }
      return { stdout: "", stderr: "", exitCode: 0 };
    };

    const adapter = new FirewalldAdapter(mockExec);
    adapter.isActive = async () => true;

    expect(await adapter.checkPort(7331)).toBe("allowed");
    expect(await adapter.checkPort(7332)).toBe("blocked");
    expect(adapter.getRemediationCommand(7332)).toBe(
      "sudo firewall-cmd --add-port=7332/tcp",
    );
  });

  it("applies firewall-cmd remediation", async () => {
    let called = "";
    const mockExec: CommandExecutor = async (file, args) => {
      called = `${file} ${args.join(" ")}`;
      return { stdout: "success\n", stderr: "", exitCode: 0 };
    };

    const adapter = new FirewalldAdapter(mockExec);
    const res = await adapter.allowPort(7332);
    expect(res.success).toBe(true);
    expect(called).toBe("sudo firewall-cmd --add-port=7332/tcp");
  });
});
