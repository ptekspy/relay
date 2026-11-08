import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

export interface WslNetworkDiscovery {
  isWsl: boolean;
  wslInternalIp?: string;
  windowsHostIp?: string;
  recommendedHostIp?: string;
}

export function detectIsWsl(): boolean {
  if (process.platform !== "linux") {
    return false;
  }

  try {
    if (existsSync("/proc/sys/fs/binfmt_misc/WSLInterop")) {
      return true;
    }
    const procVersion = readFileSync("/proc/version", "utf8");
    return /microsoft|wsl/i.test(procVersion);
  } catch {
    return false;
  }
}

export function discoverWslNetwork(): WslNetworkDiscovery {
  const isWsl = detectIsWsl();
  if (!isWsl) {
    return { isWsl: false };
  }

  let wslInternalIp: string | undefined;
  let windowsHostIp: string | undefined;

  // 1. Get Windows Host IP from /etc/resolv.conf nameserver
  try {
    const resolv = readFileSync("/etc/resolv.conf", "utf8");
    const match = resolv.match(/nameserver\s+([0-9.]+)/);
    if (match?.[1]) {
      windowsHostIp = match[1];
    }
  } catch {
    // Ignore error
  }

  // 2. Discover Windows Host LAN IP via powershell.exe if available
  let windowsLanIp: string | undefined;
  try {
    const output = execSync(
      `powershell.exe -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi*','Ethernet*' | Where-Object { $_.IPAddress -notlike '169.254*' }).IPAddress"`,
      { timeout: 1500, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();

    const ips = output
      .split(/\r?\n/)
      .map((ip) => ip.trim())
      .filter(Boolean);
    if (ips.length > 0 && ips[0]) {
      windowsLanIp = ips[0];
    }
  } catch {
    // powershell.exe not accessible or timed out
  }

  return {
    isWsl: true,
    wslInternalIp,
    windowsHostIp,
    recommendedHostIp: windowsLanIp ?? windowsHostIp,
  };
}
