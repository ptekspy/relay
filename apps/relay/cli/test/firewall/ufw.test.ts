import { describe, expect, it } from "bun:test";
import { UfwAdapter } from "../../src/firewall/adapters/ufw.js";
import type { CommandExecutor } from "../../src/firewall/types.js";

describe("UfwAdapter", () => {
  it("detects inactive firewall as allowed", async () => {
    const mockExec: CommandExecutor = async (_file, args) => {
      if (args[0] === "status") {
        return { stdout: "Status: inactive\n", stderr: "", exitCode: 0 };
      }
      return { stdout: "", stderr: "", exitCode: 0 };
    };

    const adapter = new UfwAdapter(mockExec);
    // Force test without relying on host filesystem
    adapter.isActive = async () => false;

    const status = await adapter.checkPort(7331);
    expect(status).toBe("allowed");
  });

  it("detects allowed port when present in ufw rules", async () => {
    const mockExec: CommandExecutor = async (_file, args) => {
      if (args[0] === "status") {
        return {
          stdout: `Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
7331/tcp                   ALLOW       Anywhere
`,
          stderr: "",
          exitCode: 0,
        };
      }
      return { stdout: "", stderr: "", exitCode: 0 };
    };

    const adapter = new UfwAdapter(mockExec);
    adapter.isActive = async () => true;

    const status = await adapter.checkPort(7331);
    expect(status).toBe("allowed");
  });

  it("detects blocked port when missing from ufw rules", async () => {
    const mockExec: CommandExecutor = async (_file, args) => {
      if (args[0] === "status") {
        return {
          stdout: `Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
7331/tcp                   ALLOW       Anywhere
`,
          stderr: "",
          exitCode: 0,
        };
      }
      return { stdout: "", stderr: "", exitCode: 0 };
    };

    const adapter = new UfwAdapter(mockExec);
    adapter.isActive = async () => true;

    const status = await adapter.checkPort(7332);
    expect(status).toBe("blocked");
    expect(adapter.getRemediationCommand(7332)).toBe(
      "sudo ufw allow 7332/tcp comment 'Relay Gateway'",
    );
  });

  it("executes remediation command to allow port", async () => {
    let executedCmd = "";
    const mockExec: CommandExecutor = async (file, args) => {
      executedCmd = `${file} ${args.join(" ")}`;
      return { stdout: "Rule added", stderr: "", exitCode: 0 };
    };

    const adapter = new UfwAdapter(mockExec);
    const result = await adapter.allowPort(7332);
    expect(result.success).toBe(true);
    expect(executedCmd).toBe("sudo ufw allow 7332/tcp comment Relay Gateway");
  });
});
