import os from "node:os";
import process from "node:process";
import isOnline from "is-online";
import open from "open";
import type { CliConfig } from "./args.js";
import { detectFirewallStatus, type FirewallStatus } from "./firewall.js";
import {
  checkPortReachable,
  detectLanAddress,
  type LanAddress,
} from "./networking.js";

export interface RuntimeInfo {
  name: "bun" | "deno" | "node" | "unknown";
  version: string;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  hostname: string;
  cpuCount: number;
  memoryMb: {
    total: number;
    free: number;
  };
  runtime: RuntimeInfo;
}

export interface PreflightResult {
  system: SystemInfo;
  isOnline: boolean;
  apiHealthy: boolean;
  lan: LanAddress | null;
  targetPortActive: boolean;
  firewall: FirewallStatus;
  localWebUrl?: string;
}

export function detectRuntime(): RuntimeInfo {
  const g = globalThis as {
    Bun?: { version: string };
    Deno?: { version?: { deno?: string } };
  };

  if (typeof g.Bun !== "undefined") {
    return { name: "bun", version: g.Bun.version };
  }

  if (typeof g.Deno !== "undefined") {
    return { name: "deno", version: g.Deno.version?.deno ?? "unknown" };
  }

  if (process?.versions?.node) {
    return { name: "node", version: process.versions.node };
  }

  return { name: "unknown", version: "unknown" };
}

export function collectSystemInfo(): SystemInfo {
  return {
    platform: `${os.platform()} (${os.release()})`,
    arch: os.arch(),
    hostname: os.hostname(),
    cpuCount: os.cpus().length,
    memoryMb: {
      total: Math.round(os.totalmem() / 1024 / 1024),
      free: Math.round(os.freemem() / 1024 / 1024),
    },
    runtime: detectRuntime(),
  };
}

export async function checkRelayApiHealth(timeoutMs = 2500): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch("https://api.relay.paddy.systems/health", {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

export async function runPreflightChecks(
  config: CliConfig,
): Promise<PreflightResult> {
  const system = collectSystemInfo();
  const lan = detectLanAddress();

  const [onlineResult, apiResult, targetActive, firewallResult] =
    await Promise.allSettled([
      isOnline({
        fallbackUrls: ["https://api.relay.paddy.systems/health"],
      }),
      checkRelayApiHealth(),
      checkPortReachable(config.port, config.host ?? "127.0.0.1"),
      detectFirewallStatus(),
    ]);

  const online =
    onlineResult.status === "fulfilled" ? onlineResult.value : false;
  const apiHealthy = apiResult.status === "fulfilled" ? apiResult.value : false;
  const isTargetActive =
    targetActive.status === "fulfilled" ? targetActive.value : false;
  const firewall: FirewallStatus =
    firewallResult.status === "fulfilled"
      ? firewallResult.value
      : { type: "none", enabled: false };

  return {
    system,
    isOnline: online,
    apiHealthy,
    lan,
    targetPortActive: isTargetActive,
    firewall,
  };
}

export interface SessionConnectParams {
  sessionId: string;
  token: string;
  shortCode: string;
  targetPort: number;
  gatewayPort: number;
  host: string;
}

export async function handlePostPreflightAction(
  config: CliConfig,
  preflight: PreflightResult,
  sessionInfo?: SessionConnectParams | string,
): Promise<void> {
  // Step 9: If --no-browser was included, the browser should never load
  if (config.noBrowser) {
    return;
  }

  let queryString = "";
  if (typeof sessionInfo === "object" && sessionInfo !== null) {
    const params = new URLSearchParams({
      session_id: sessionInfo.sessionId,
      token: sessionInfo.token,
      short_code: sessionInfo.shortCode,
      port: String(sessionInfo.targetPort),
      gateway_port: String(sessionInfo.gatewayPort),
      host: sessionInfo.host,
    });
    queryString = `?${params.toString()}`;
  } else if (
    typeof sessionInfo === "string" &&
    sessionInfo.startsWith("http")
  ) {
    await open(sessionInfo);
    return;
  }

  // Step 3: If online -> load relay.paddy.systems/connect?<connection stuff>
  if (preflight.isOnline && preflight.apiHealthy) {
    await open(`https://relay.paddy.systems/connect${queryString}`);
    return;
  }

  // Step 3: If offline / local -> load local hosted version
  const localPort = process.env.RELAY_LOCAL_PORT || 9481;
  const localUrl = `http://localhost:${localPort}/connect${queryString}`;
  preflight.localWebUrl = localUrl;
  await open(localUrl);
}
