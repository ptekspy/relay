export class TerminalAccessibilityHelper {
  public stripAnsi(text: string): string {
    // biome-ignore lint/suspicious/noControlCharactersInRegex: standard ANSI escape stripping
    return text.replace(/\x1b\[[0-9;]*m/g, "");
  }

  public generateScreenReaderSummary(sessionInfo: {
    shortCode: string;
    port: number;
    connectedDevices: number;
    avgLatencyMs: number;
  }): string {
    return `
Relay Active Session
Pairing Short Code: ${sessionInfo.shortCode}
Local Development Server Port: ${sessionInfo.port}
Currently Connected Devices: ${sessionInfo.connectedDevices}
Average Network Latency: ${sessionInfo.avgLatencyMs} milliseconds
Use key R to reload all connected devices. Use key Q to quit.
`.trim();
  }
}

export const terminalAccessibilityHelper = new TerminalAccessibilityHelper();
