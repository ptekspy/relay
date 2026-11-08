import { isIP } from "node:net";
import process from "node:process";
import { parseArgs } from "node:util";

export interface CliConfig {
  port: number;
  host?: string;
  gatewayPort?: number;
  noBrowser: boolean;
  largeQr: boolean;
  https: boolean;
  lanDomain?: string;
  isCi?: boolean;
  ciCommand?: string;
  ciOutputFile?: string;
}

const HELP_TEXT = `
relay — Local tunnel and session pipeline

Usage:
  relay <port> [options]

Arguments:
  <port>                  Port on the local machine to share (1-65535) [required]

Options:
  --host <ip>             Hosting IP address (valid IPv4 or IPv6)
  --gateway-port <port>   Port for Relay LAN gateway (default: 7331)
  --https                 Enable trusted local wildcard HTTPS via *.lan.relay.paddy.systems
  --lan-domain <domain>   Custom LAN wildcard apex domain (default: lan.relay.paddy.systems)
  --no-browser            Continue in CLI without opening browser
  --large-qr              Display high-visibility large QR code for low-grade camera sensors
  -h, --help              Show this help message

Examples:
  relay 3000
  relay 3000 --https
  relay 8080 --host 192.168.1.50 --https
  relay 3000 --gateway-port 7331
  relay 3000 --no-browser
  relay 3000 --large-qr
`;

export function parseCliArgs(
  rawArgs: string[] = process.argv.slice(2),
): CliConfig {
  let parsed: ReturnType<typeof parseArgs>;

  try {
    parsed = parseArgs({
      args: rawArgs,
      options: {
        host: { type: "string" },
        "gateway-port": { type: "string" },
        https: { type: "boolean", default: false },
        "lan-domain": { type: "string" },
        "no-browser": { type: "boolean", default: false },
        "large-qr": { type: "boolean", default: false },
        command: { type: "string" },
        "output-file": { type: "string" },
        help: { type: "boolean", short: "h", default: false },
      },
      allowPositionals: true,
      strict: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}\nRun "relay --help" for usage.`);
    process.exit(1);
  }

  const { values, positionals } = parsed;

  if (values.help) {
    console.log(HELP_TEXT.trim());
    process.exit(0);
  }

  // 1. Check for 'ci' subcommand
  const isCi = positionals[0] === "ci";
  const portArg = isCi ? positionals[1] : positionals[0];

  if (!portArg) {
    console.error(
      'Error: Missing required argument <port>.\nRun "relay --help" for usage.',
    );
    process.exit(1);
  }

  const port = Number(portArg);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error(
      `Error: Invalid port "${portArg}". Port must be an integer between 1 and 65535.`,
    );
    process.exit(1);
  }

  // 2. Validate optional --host
  const host = values.host as string | undefined;
  if (host !== undefined) {
    const ipVersion = isIP(host);
    if (ipVersion === 0) {
      console.error(
        `Error: Invalid host "${host}". Must be a valid IPv4 or IPv6 address.`,
      );
      process.exit(1);
    }
  }

  // 3. Validate optional --gateway-port
  let gatewayPort: number | undefined;
  if (values["gateway-port"] !== undefined) {
    const gwPortNum = Number(values["gateway-port"]);
    if (!Number.isInteger(gwPortNum) || gwPortNum < 1 || gwPortNum > 65535) {
      console.error(
        `Error: Invalid gateway-port "${values["gateway-port"]}". Must be between 1 and 65535.`,
      );
      process.exit(1);
    }
    gatewayPort = gwPortNum;
  }

  return {
    port,
    host,
    gatewayPort,
    https: Boolean(values.https),
    lanDomain: values["lan-domain"] as string | undefined,
    noBrowser: Boolean(values["no-browser"]),
    largeQr: Boolean(values["large-qr"]),
    isCi,
    ciCommand: values.command as string | undefined,
    ciOutputFile: values["output-file"] as string | undefined,
  };
}
