# Relay CLI Command Reference

Comprehensive manual and options reference for the `relay` command-line interface.

## Synopsis

```bash
relay <port> [options]
relay completion <shell>
```

---

## Positional Arguments

| Argument | Type | Description |
| :--- | :--- | :--- |
| `<port>` | integer (1–65535) | **Required**. Port of the upstream development server (e.g. 3000, 5173). |

---

## Flags & Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `--host <ip>` | string | Auto | Specify host IP manually instead of auto-detecting LAN interface. |
| `--gateway-port <port>` | integer | `7331` | Local gateway listener port. |
| `--no-browser` | boolean | `false` | Do not automatically open the receiver web dashboard on startup. |
| `--large-qr` | boolean | `false` | Render high-visibility enlarged QR code for greater camera scanning distance. |
| `--json` | boolean | `false` | Output structured NDJSON events for automation and CI/CD pipelines. |
| `-h`, `--help` | boolean | `false` | Show help text and exit. |

---

## Subcommands

### `relay completion <shell>`
Generate shell tab-completion scripts.

```bash
# Bash
eval "$(relay completion bash)"

# Zsh
eval "$(relay completion zsh)"

# Fish
relay completion fish | source
```

---

## Exit Codes

| Code | Meaning |
| :--- | :--- |
| `0` | Clean termination (SIGINT / Ctrl+C). |
| `1` | Invalid argument, missing port, or upstream server port blocked. |
