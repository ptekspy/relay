import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export function generateManpage(): string {
  const date = "September 2026";
  return `.\\" Manpage for Paddy Systems Relay
.TH RELAY 1 "${date}" "1.0.0" "Relay User Manual"
.SH NAME
relay \\- Instant zero-config local device testing and telemetry pipeline
.SH SYNOPSIS
.B relay
\\fIport\\fR [\\fB\\-\\-host\\fR \\fIip\\fR] [\\fB\\-\\-gateway\\-port\\fR \\fIport\\fR] [\\fB\\-\\-no\\-browser\\fR] [\\fB\\-\\-large\\-qr\\fR] [\\fB\\-\\-json\\fR]
.br
.B relay completion
\\fIshell\\fR
.SH DESCRIPTION
.B relay
probes a locally running web development server, launches an embedded zero-latency LAN gateway, and renders a terminal QR code and short pairing code for instantaneous mobile testing.
.SH ARGUMENTS
.TP
\\fIport\\fR
The local TCP port where your application or dev server is listening (e.g. 3000, 5173, 8080). Must be an integer between 1 and 65535.
.SH OPTIONS
.TP
\\fB\\-\\-host\\fR \\fIip\\fR
Explicitly specify the hosting IP address (IPv4 or IPv6) for LAN discovery.
.TP
\\fB\\-\\-gateway\\-port\\fR \\fIport\\fR
Custom port for the Relay LAN gateway. Defaults to 7331.
.TP
\\fB\\-\\-no\\-browser\\fR
Run headless in the terminal without attempting to open the local web UI automatically.
.TP
\\fB\\-\\-large\\-qr\\fR
Render an enlarged high-contrast ASCII QR code for scanning from across a desk or with lower-resolution camera sensors.
.TP
\\fB\\-\\-json\\fR
Output structured, newline-delimited JSON events for CI and script automation.
.TP
\\fB\\-h\\fR, \\fB\\-\\-help\\fR
Display command-line help text and exit.
.SH COMMANDS
.TP
\\fBcompletion\\fR \\fIshell\\fR
Generate shell tab-completion scripts. Supported shells: \\fIbash\\fR, \\fIzsh\\fR, \\fIfish\\fR.
.SH AUTHOR
Paddy Systems Ltd (support@paddy.systems)
`;
}

export function generateCliReferenceMarkdown(): string {
  return `# Relay CLI Command Reference

Comprehensive manual and options reference for the \`relay\` command-line interface.

## Synopsis

\`\`\`bash
relay <port> [options]
relay completion <shell>
\`\`\`

---

## Positional Arguments

| Argument | Type | Description |
| :--- | :--- | :--- |
| \`<port>\` | integer (1–65535) | **Required**. Port of the upstream development server (e.g. 3000, 5173). |

---

## Flags & Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| \`--host <ip>\` | string | Auto | Specify host IP manually instead of auto-detecting LAN interface. |
| \`--gateway-port <port>\` | integer | \`7331\` | Local gateway listener port. |
| \`--no-browser\` | boolean | \`false\` | Do not automatically open the receiver web dashboard on startup. |
| \`--large-qr\` | boolean | \`false\` | Render high-visibility enlarged QR code for greater camera scanning distance. |
| \`--json\` | boolean | \`false\` | Output structured NDJSON events for automation and CI/CD pipelines. |
| \`-h\`, \`--help\` | boolean | \`false\` | Show help text and exit. |

---

## Subcommands

### \`relay completion <shell>\`
Generate shell tab-completion scripts.

\`\`\`bash
# Bash
eval "$(relay completion bash)"

# Zsh
eval "$(relay completion zsh)"

# Fish
relay completion fish | source
\`\`\`

---

## Exit Codes

| Code | Meaning |
| :--- | :--- |
| \`0\` | Clean termination (SIGINT / Ctrl+C). |
| \`1\` | Invalid argument, missing port, or upstream server port blocked. |
`;
}

export function generateAllDocs(outputDir = "docs/relay"): void {
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const manpage = generateManpage();
  const manPath = resolve(outputDir, "relay.1");
  writeFileSync(manPath, manpage, "utf8");
  console.log(`[manpage-gen] Generated ${manPath}`);

  const markdown = generateCliReferenceMarkdown();
  const mdPath = resolve(outputDir, "CLI_REFERENCE.md");
  writeFileSync(mdPath, markdown, "utf8");
  console.log(`[manpage-gen] Generated ${mdPath}`);
}

if (import.meta.main) {
  generateAllDocs();
}
