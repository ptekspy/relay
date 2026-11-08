/**
 * Relay Headless CLI Runner for CI/CD Pipelines (relay ci)
 *
 * Dedicated non-interactive runner for automated CI environments (GitHub Actions, GitLab CI).
 * Disables all Ink/TUI rendering, outputs structured logs & environment variables,
 * writes endpoint JSON files, executes test sub-processes, and propagates exit codes cleanly.
 *
 * Note for Octavia: Used in apps/relay/cli/src/main.tsx and CI automation.
 */

import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

export interface CiRunnerConfig {
  port: number;
  command?: string;
  outputFile?: string;
  timeoutSeconds?: number;
  tunnelUrl?: string;
  gatewayPort?: number;
}

export interface CiEndpointMetadata {
  sessionId: string;
  targetPort: number;
  gatewayPort: number;
  tunnelUrl: string;
  lanUrl: string;
  timestamp: string;
}

export class CiRunner {
  private config: CiRunnerConfig;

  constructor(config: CiRunnerConfig) {
    this.config = {
      timeoutSeconds: 300,
      gatewayPort: 7331,
      ...config,
    };
  }

  public generateMetadata(
    sessionId = `ci_${Math.random().toString(36).slice(2, 10)}`,
  ): CiEndpointMetadata {
    const tunnelUrl =
      this.config.tunnelUrl ?? `https://${sessionId}.relay.paddy.systems`;
    const gatewayPort = this.config.gatewayPort ?? 7331;

    return {
      sessionId,
      targetPort: this.config.port,
      gatewayPort,
      tunnelUrl,
      lanUrl: `http://127.0.0.1:${gatewayPort}`,
      timestamp: new Date().toISOString(),
    };
  }

  public exportEndpoints(metadata: CiEndpointMetadata): void {
    // Print machine-readable environment variables for CI runners
    process.stdout.write(
      `::notice title=Relay CI::Tunnel active at ${metadata.tunnelUrl}\n`,
    );
    process.stdout.write(`RELAY_SESSION_ID=${metadata.sessionId}\n`);
    process.stdout.write(`RELAY_TUNNEL_URL=${metadata.tunnelUrl}\n`);
    process.stdout.write(`RELAY_GATEWAY_URL=${metadata.lanUrl}\n`);

    if (this.config.outputFile) {
      writeFileSync(
        this.config.outputFile,
        JSON.stringify(metadata, null, 2),
        "utf8",
      );
    }
  }

  public async executeCommand(
    command: string,
    metadata: CiEndpointMetadata,
  ): Promise<number> {
    return new Promise<number>((resolve) => {
      const child = spawn(command, {
        shell: true,
        stdio: "inherit",
        env: {
          ...process.env,
          RELAY_SESSION_ID: metadata.sessionId,
          RELAY_TUNNEL_URL: metadata.tunnelUrl,
          RELAY_GATEWAY_URL: metadata.lanUrl,
          CI: "true",
        },
      });

      child.on("close", (code) => {
        resolve(code ?? 0);
      });

      child.on("error", () => {
        resolve(1);
      });
    });
  }

  public async run(
    customExecutor?: (meta: CiEndpointMetadata) => Promise<number>,
  ): Promise<number> {
    const metadata = this.generateMetadata();
    this.exportEndpoints(metadata);

    if (customExecutor) {
      return customExecutor(metadata);
    }

    if (this.config.command) {
      return this.executeCommand(this.config.command, metadata);
    }

    return 0;
  }
}
