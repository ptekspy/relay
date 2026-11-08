import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import process from "node:process";
import { promisify } from "node:util";

export * from "./firewall/index.js";

const execFileAsync = promisify(execFile);

export interface FirewallStatus {
  type: "ufw" | "firewalld" | "pf" | "windows" | "none";
  enabled: boolean;
  message?: string;
}

export interface PortProcessInfo {
  pid: number;
  command: string;
}

/**
 * Detects whether the host OS has an active local firewall that might block incoming LAN traffic.
 */
export async function detectFirewallStatus(): Promise<FirewallStatus> {
  const platform = process.platform;

  if (platform === "linux") {
    // Check Ubuntu / Debian UFW
    try {
      if (existsSync("/etc/ufw/ufw.conf")) {
        const conf = readFileSync("/etc/ufw/ufw.conf", "utf8");
        const isEnabled = /^ENABLED=yes/im.test(conf);
        if (isEnabled) {
          return {
            type: "ufw",
            enabled: true,
            message:
              "UFW firewall is active (inbound ports may require an allow rule)",
          };
        }
      }
    } catch {
      // Fall through
    }

    // Check firewalld (Fedora / RHEL)
    try {
      const { stdout } = await execFileAsync("firewall-cmd", ["--state"], {
        timeout: 1000,
      });
      if (stdout.trim() === "running") {
        return {
          type: "firewalld",
          enabled: true,
          message: "firewalld is active",
        };
      }
    } catch {
      // Not firewalld or not running
    }

    return { type: "none", enabled: false };
  }

  if (platform === "win32") {
    return {
      type: "windows",
      enabled: true,
      message: "Windows Defender Firewall may prompt to allow network access",
    };
  }

  if (platform === "darwin") {
    return {
      type: "pf",
      enabled: false,
      message: "macOS Application Firewall",
    };
  }

  return { type: "none", enabled: false };
}

/**
 * Identifies the process currently occupying a given TCP port (if any).
 */
export async function findProcessOnPort(
  port: number,
): Promise<PortProcessInfo | null> {
  if (process.platform === "win32") return null;

  try {
    // Try ss first (standard on Linux)
    const { stdout } = await execFileAsync(
      "ss",
      ["-lptn", `sport = :${port}`],
      { timeout: 1500 },
    );
    const match = /pid=(\d+)/.exec(stdout);
    if (match?.[1]) {
      const pid = Number(match[1]);
      const comm = await getProcessName(pid);
      return { pid, command: comm };
    }
  } catch {
    // Try lsof fallback
    try {
      const { stdout } = await execFileAsync("lsof", ["-i", `:${port}`, "-t"], {
        timeout: 1500,
      });
      const firstLine = stdout.trim().split("\n")[0];
      if (firstLine) {
        const pid = Number(firstLine);
        if (Number.isInteger(pid)) {
          const comm = await getProcessName(pid);
          return { pid, command: comm };
        }
      }
    } catch {
      // Neither available or no process
    }
  }

  return null;
}

/**
 * Attempts to retrieve process name from /proc or ps
 */
async function getProcessName(pid: number): Promise<string> {
  try {
    if (existsSync(`/proc/${pid}/comm`)) {
      return readFileSync(`/proc/${pid}/comm`, "utf8").trim();
    }
    const { stdout } = await execFileAsync(
      "ps",
      ["-p", String(pid), "-o", "comm="],
      { timeout: 1000 },
    );
    return stdout.trim();
  } catch {
    return "unknown";
  }
}

/**
 * Attempts to terminate a stale process occupying the gateway port.
 */
export async function terminateProcess(pid: number): Promise<boolean> {
  try {
    process.kill(pid, "SIGTERM");
    await new Promise((r) => setTimeout(r, 300));
    try {
      process.kill(pid, 0);
      process.kill(pid, "SIGKILL");
    } catch {
      return true;
    }
    return true;
  } catch {
    return false;
  }
}
