export type PortStatus = "allowed" | "blocked" | "unknown";

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export type CommandExecutor = (
  file: string,
  args: string[],
  options?: { timeout?: number },
) => Promise<CommandResult>;

export interface FirewallAdapter {
  readonly name: string;
  readonly type: "ufw" | "firewalld" | "windows" | "macos" | "none";

  /**
   * Returns true if this firewall system is available on the current platform.
   */
  isAvailable(): Promise<boolean>;

  /**
   * Returns true if the firewall is currently running/enforcing rules.
   */
  isActive(): Promise<boolean>;

  /**
   * Checks whether the given inbound TCP port is permitted by current rules.
   */
  checkPort(port: number): Promise<PortStatus>;

  /**
   * Returns the command string the user or administrator can execute to permit the port.
   */
  getRemediationCommand(port: number): string;

  /**
   * Attempts to automatically configure the firewall to allow the port.
   */
  allowPort(port: number): Promise<{ success: boolean; message: string }>;
}
