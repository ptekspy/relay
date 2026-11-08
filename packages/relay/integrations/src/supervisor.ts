/**
 * Multi-Process Dev Supervisor
 *
 * Wraps composite dev commands (Turbo dev, Procfile, npm run dev) and guarantees
 * clean process group shutdown without leaving orphaned background processes.
 *
 * Note for Octavia: This uses process groups (-pid) to terminate entire child trees cleanly.
 */

import { type ChildProcess, spawn } from "node:child_process";

export interface DevSupervisorOptions {
  command: string;
  cwd?: string;
  targetPort?: number;
  gracefulTimeoutMs?: number;
  env?: NodeJS.ProcessEnv;
}

export interface SupervisorStatus {
  isRunning: boolean;
  pid: number | null;
  detectedPort: number | null;
  exitCode: number | null;
}

export class DevSupervisor {
  private child: ChildProcess | null = null;
  private isTerminating = false;
  private detectedPort: number | null = null;
  private exitCode: number | null = null;

  private readonly command: string;
  private readonly cwd: string;
  private readonly gracefulTimeoutMs: number;
  private readonly env: NodeJS.ProcessEnv;

  constructor(options: DevSupervisorOptions) {
    this.command = options.command;
    this.cwd = options.cwd ?? process.cwd();
    this.detectedPort = options.targetPort ?? null;
    this.gracefulTimeoutMs = options.gracefulTimeoutMs ?? 1500;
    this.env = { ...process.env, ...(options.env || {}) };
  }

  public getStatus(): SupervisorStatus {
    return {
      isRunning:
        this.child !== null && !this.child.killed && this.exitCode === null,
      pid: this.child?.pid ?? null,
      detectedPort: this.detectedPort,
      exitCode: this.exitCode,
    };
  }

  public start(): Promise<number | null> {
    return new Promise((resolve, reject) => {
      try {
        // Spawn shell command in detached mode so it creates a distinct process group
        this.child = spawn(this.command, {
          shell: true,
          cwd: this.cwd,
          env: this.env,
          detached: process.platform !== "win32",
          stdio: ["ignore", "pipe", "pipe"],
        });

        this.child.stdout?.on("data", (chunk: Buffer | string) => {
          this.parsePortFromLog(chunk.toString());
        });

        this.child.stderr?.on("data", (chunk: Buffer | string) => {
          this.parsePortFromLog(chunk.toString());
        });

        this.child.on("error", (err) => {
          if (!this.isTerminating) {
            reject(err);
          }
        });

        this.child.on("close", (code) => {
          this.exitCode = code;
          resolve(code);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  public async terminate(): Promise<void> {
    if (!this.child || this.child.killed || this.isTerminating) {
      return;
    }

    this.isTerminating = true;
    const pid = this.child.pid;

    if (!pid) return;

    try {
      if (process.platform !== "win32") {
        // Send SIGTERM to the process group (-pid)
        try {
          process.kill(-pid, "SIGTERM");
        } catch {
          // Process or group may already be dead
        }

        // Wait for graceful exit
        const exited = await this.waitForExit(this.gracefulTimeoutMs);
        if (!exited) {
          // Force kill group with SIGKILL
          try {
            process.kill(-pid, "SIGKILL");
          } catch {
            // Ignore if already dead
          }
        }
      } else {
        this.child.kill("SIGTERM");
      }
    } finally {
      this.child = null;
      this.isTerminating = false;
    }
  }

  public static extractPortFromLog(log: string): number | null {
    const portMatch =
      log.match(/localhost:(\d{4,5})/) ||
      log.match(/127\.0\.0\.1:(\d{4,5})/) ||
      log.match(/port\s+(\d{4,5})/i) ||
      log.match(/:(\d{4,5})\b/);

    if (portMatch && portMatch[1]) {
      const port = Number.parseInt(portMatch[1], 10);
      if (!Number.isNaN(port) && port >= 1024 && port <= 65535) {
        return port;
      }
    }

    return null;
  }

  public parsePortFromLog(log: string): number | null {
    if (this.detectedPort !== null) return this.detectedPort;

    const extracted = DevSupervisor.extractPortFromLog(log);
    if (extracted !== null) {
      this.detectedPort = extracted;
    }
    return this.detectedPort;
  }

  private waitForExit(timeoutMs: number): Promise<boolean> {
    return new Promise((resolve) => {
      const start = Date.now();
      const interval = setInterval(() => {
        if (this.exitCode !== null || !this.child) {
          clearInterval(interval);
          resolve(true);
        } else if (Date.now() - start >= timeoutMs) {
          clearInterval(interval);
          resolve(false);
        }
      }, 50);
    });
  }
}
