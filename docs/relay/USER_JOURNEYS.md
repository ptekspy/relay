# Paddy Systems Relay — System Assessment & Checkable User Journeys

**Document Status:** Grounded Assessment & Verification Specification  
**Applies to:** `apps/relay/*`, `packages/relay/*`, `docs/relay/*`  
**Execution Environment:** Linux / macOS / WSL (Node.js 20+, Bun 1.4+, React 19, Next.js)

---

# Part 1: System Assessment — Everything You Are Able to Do as a User

Paddy Systems Relay is a local and remote development session pipeline designed to eliminate the friction, latency, and security trade-offs of testing local development servers on physical mobile devices, secondary screens, and within remote teams.

Based on the current architecture in `p-s-core`, here is everything you as a user are capable of doing with Relay:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEVELOPER HOST MACHINE                            │
│                                                                             │
│  [Target Dev Server] :3000, :5173, etc.                                     │
│         ▲                                                                   │
│         │ (Local reverse proxy + HMR WebSocket bridge)                      │
│         ▼                                                                   │
│  [Relay CLI Host & Gateway] :7331                                           │
│    ├── Preflight Probe & Auto-Retry Engine                                  │
│    ├── Local Firewall Auditor (UFW, Firewalld, macOS, Windows)              │
│    ├── Timing-Safe 32-Byte Token & Cookie Auth Manager                      │
│    ├── Sliding-Window Anti-Bruteforce Rate Limiter                          │
│    ├── Multi-Receiver Connection Pool Tracker                               │
│    └── Ink Terminal TUI (QR, Short Code, Receivers, Health, Events)         │
└───────────────────────┬─────────────────────────────┬───────────────────────┘
                        │                             │
       Direct Local LAN │ (<1ms latency)              │ Outbound WSS Tunnel
       (Free, Zero Cloud, Air-Gapped)                 │ (Team / Remote Cloud)
                        ▼                             ▼
┌────────────────────────────────┐           ┌────────────────────────────────┐
│      LOCAL RECEIVER DEVICE     │           │      CLOUD EDGE & REMOTE       │
│                                │           │                                │
│ [Local Web App / Receiver HUD] │           │ [Anycast Edge Routing Cluster] │
│   ├── QR Scan or Short Code    │           │ [Cloud Web Team Dashboard]     │
│   ├── Sandboxed Target Viewport│           │   ├── Active Session Feed      │
│   ├── Floating Status HUD      │           │   ├── Collaborative Annotations│
│   ├── Console Log Mirror       │           │   ├── Shared Device Farm Farm  │
│   └── Orientation Toggle       │           │   └── Security SIEM Audit Logs │
└────────────────────────────────┘           └────────────────────────────────┘
```

---

## 1. CLI Host & Local Development (Host Machine)

### Launching Local Bridge Sessions
- **Bridge Any Upstream Dev Server**: Run `relay <port>` to instantly bridge any server (Next.js, Vite, Nuxt, Astro, SvelteKit, Django, Rails, Express, Phoenix, Go, etc.) without altering code or installing application SDKs.
- **Port Availability Preflight**: The CLI automatically checks whether your upstream port is listening. If your dev server is still booting up, Relay doesn't crash; it enters an auto-polling loop with countdown timer until the port opens.
- **LAN Interface Auto-Discovery**: Automatically determines your primary active network interface and local IP address (e.g., `192.168.1.45`), avoiding manual IP hunting.
- **Manual Interface Override**: Specify an explicit network interface using `--host <ip>` if you have multiple NICs, bridges, or virtual adapters.
- **Firewall Health Auditing & Remediation**: Automatically audits whether the gateway port (default `7331`) is permitted through your host firewall (`ufw` and `firewalld` on Linux, `socketfilterfw` on macOS, `netsh`/PowerShell on Windows). If blocked, it generates the exact elevated remediation command needed to unblock it.
- **WSL / WSL2 Bridge Diagnostics**: Automatically detects Windows Subsystem for Linux environments, resolves the host Windows IP, and provides bridging instructions.

### Terminal Interactive Interface (Ink TUI)
- **Pair Device (QR)**: Renders a high-contrast ASCII QR code, an 8-character human-friendly short code (e.g. `R-7K4P-92MX`), and direct URL.
- **High-Visibility QR Mode**: Pass `--large-qr` to render a high-density QR code for low-grade cameras or greater scanning distance across a room.
- **Connected Receivers View**: View a live table of every connected physical device (IP address, operating system, browser user-agent, initial connect time, and real-time round-trip ping latency).
- **Relay Status View**: Live health dashboard displaying gateway listener status, target dev server HTTP status codes, network interfaces, firewall status, and Node/Bun runtime details.
- **Stream Events View**: Live tail of proxied HTTP requests, WebSocket upgrades, receiver connections, and errors.
- **Configuration View**: Inspect all active CLI parameters, target ports, and system flags.
- **Headless Mode**: Pass `--no-browser` to prevent the CLI from automatically launching the receiver web dashboard on the host machine.

### Local Gateway & Security Engine
- **LAN Reverse Proxy (`:7331`)**: Reverse-proxies HTTP and WebSocket traffic transparently to your target dev server.
- **Stale Port Reclamation**: If port 7331 is held by an orphaned Bun or Node Relay process, Relay reclaims the port gracefully; otherwise, it auto-displaces to 7332+ with a notification.
- **HMR Preservation**: Automatically intercepts and rewrites Host/Origin headers for Next.js (`/_next/hmr`, `/_next/webpack-hmr`), Vite (`/@vite/client`, `vite-hmr`), Turbopack, and font loaders so hot module replacement works seamlessly on secondary devices.
- **Timing-Safe Ephemeral Cryptography**: Generates a 32-byte cryptographic session token. Unauthenticated requests are rejected with `401 Unauthorized`.
- **URL Token Sanitization**: Once paired via QR, the token is stripped from the browser URL bar and stored in a secure `__relay_session` HttpOnly cookie.
- **Sliding-Window Rate Limiting**: Enforces a rate limiter on unauthenticated requests to prevent brute-force short-code guessing on local networks.
- **Target Unavailable Fallback**: Serves a polished, actionable 502 error page if the upstream dev server crashes or stops, advising how to restart it.

### Automation & Shell Tooling
- **Headless CI/CD Runner (`relay ci`)**: Run `relay ci <port> --command "<cmd>" [--output-file <file>]` to spin up a headless tunnel, output GitHub Actions `::notice::` workflow annotations, execute automated integration or mobile test suites, export machine-readable endpoint metadata, and cleanly propagate child exit codes.
- **Shell Tab-Completion**: Run `relay completion <bash|zsh|fish>` to generate shell auto-completion scripts.

---

## 2. Local Receiver Experience (Physical Mobile / Secondary Device)

- **Camera QR Pairing**: Scan the terminal QR code using iOS Camera or Android Google Lens to pair instantly with no typing and zero account registration.
- **Short-Code Pairing (`/pair`)**: Navigate to the local dashboard and enter the 8-character short code. Ambiguous characters (`0`, `O`, `1`, `I`) are excluded to avoid entry mistakes.
- **Sandboxed Viewport (`/receiver`)**: The target web application runs inside a sandboxed viewport preserving native touch gestures and full functionality.
- **Floating HUD**:
  - Live round-trip latency indicator with animated heartbeat.
  - Live error count pill tracking uncaught errors and console exceptions.
  - Frame Reload button (`↻`) to refresh the viewport iframe without reloading the parent HUD.
  - Orientation toggle (`↺`) switching between Portrait and Landscape simulated viewports.
  - Console drawer toggle (`⌨`).
- **In-Browser Console Mirror**:
  - Intercepts and streams `console.log`, `info`, `warn`, and `error` from the running application into an on-device drawer.
  - Filter logs by severity level (`All`, `Warn`, `Error`).
  - Clear log history.
- **Offline / Subnet Disconnect Detection**: Automatically detects network loss and presents a reconnecting notification banner.

---

## 3. Cloud Web & Team Collaboration (Remote Mode)

- **Remote Edge Tunnels**: Connect devices across disparate networks or mobile cellular carriers via Anycast edge routing.
- **Multi-Developer Active Session Feed (`/dashboard/sessions`)**: View all live team sessions, filterable by project name, Git branch, developer, and session state.
- **Live Screen Viewing & Annotation Canvas (`/view`)**:
  - Watch live remote sessions with low-latency streaming.
  - Overlay collaborative annotations: draw rectangles, arrows, freehand lines, and color-coded callouts over the live application viewport for visual bug reporting.
- **Shared Team Device Farm (`/dashboard/devices`)**:
  - Central inventory of physical test devices connected to the team network.
  - Exclusive device locking: reserve a device for an active test session to prevent collisions.
  - Real-time battery level and charging state telemetry.
- **Branded Invitation Landing Pages (`/join`)**:
  - Share time-limited invitation links with team members and stakeholders.
  - Live expiration countdown and token validation.
- **Security & Compliance Audit Feed (`/dashboard/audit`)**:
  - Filterable security event audit log tracking pairing attempts, IP addresses, and user roles.
  - Automated device trust score calculations.

---

## 4. Specialized Capabilities & Developer Tooling

- **Device Emulation**: Mock GPS geolocation coordinates, device orientation (accelerometer), safe area insets (notches/home bars), and network conditions (3G/4G/Offline).
- **Deep Inspection**: Inspect live DOM trees, CSS styles, storage (Cookies, LocalStorage, SessionStorage, IndexedDB), memory utilization, and thread activity.
- **Network HAR Exporter**: Record and export full HTTP request/response archives.
- **Deterministic Recording & Replay**: Record full session interactions as hybrid event streams and replay them step-by-step for bug reproduction.
- **Bug Reporting Integrations**: Package bugs into GitHub, Jira, or Linear issues complete with device specifications, console logs, network traces, and annotated screenshots.

---

# Part 2: Checkable User Journeys to Verify

Each user journey below is self-contained and checkable. Instructions are fully stated in every journey so any journey can be executed independently.

---

### Journey 1: Local Developer Happy Path (CLI Host + Dev Server Pairing via QR Token URL)
- **Goal**: Verify that starting a target dev server and launching Relay CLI establishes a functional local gateway that authenticates via token and proxies dev server content.
- **Prerequisites**: Bun 1.4+ installed, terminal access.

- [ ] **Step 1: Start target test dev server**
  ```bash
  cd /home/paddy/code/p-s-core/test/fixtures/relay-stress-app
  PORT=4321 bun run server.ts
  ```
  *Verify*: Terminal displays `[Relay Stress App] Running on http://localhost:4321`.

- [ ] **Step 2: In a second terminal, start Relay CLI pointing to port 4321**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/cli
  bun run src/main.tsx 4321 --no-browser
  ```
  *Verify*:
  1. Terminal Ink TUI loads with `PADDY SYSTEMS RELAY`.
  2. Preflight passes target port 4321.
  3. Gateway starts on port `7331` (or next available).
  4. ASCII QR code is rendered alongside an 8-character short code.
  5. URL is displayed: `http://<LAN_IP>:7331/?relay_token=<TOKEN>`.

- [ ] **Step 3: Test authenticated browser access via token URL**
  In a third terminal or browser, request the gateway URL with the token:
  ```bash
  # Example fetching root with query token:
  curl -i "http://127.0.0.1:7331/?relay_token=$(curl -s http://127.0.0.1:7331/ | grep -o 'token=[^"]*' | head -1 | cut -d= -f2)"
  ```
  *Or directly test via unit verification*:
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/cli
  bun test test/gateway.test.ts
  ```
  *Verify*: Gateway responds with `302 Found`, sets `__relay_session` cookie, and proxies target HTML content containing `Relay Stress & Telemetry Target Application`.

---

### Journey 2: Receiver Pairing via Alphanumeric Short Code on Secondary Device
- **Goal**: Verify that a user without a camera can pair using the 8-character short code without entering ambiguous characters.
- **Prerequisites**: Bun 1.4+ installed.

- [ ] **Step 1: Verify short-code generator excludes ambiguous characters**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/local-web
  bun test test/receiver.test.ts -t "filters ambiguous characters"
  ```
  *Verify*: Test passes confirming that characters `0`, `O`, `1`, `I` are strictly stripped from generated and parsed short codes.

- [ ] **Step 2: Start target dev server**
  ```bash
  cd /home/paddy/code/p-s-core/test/fixtures/relay-stress-app
  PORT=4321 bun run server.ts
  ```

- [ ] **Step 3: Launch Relay CLI**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/cli
  bun run src/main.tsx 4321 --no-browser
  ```
  *Verify*: CLI displays the 8-character code formatted as `R-XXXX-XXXX`.

- [ ] **Step 4: Launch local web app and open `/pair`**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/local-web
  bun run dev -- -p 3001
  ```
  Open `http://localhost:3001/pair` in browser, enter the short code shown in the CLI, and submit.  
  *Verify*: App validates the code and routes to `/receiver`.

---

### Journey 3: Target Server Boot Delay / Preflight Wait & Auto-Recovery
- **Goal**: Verify that starting Relay *before* the development server starts does not crash Relay, but enters preflight countdown and automatically hooks up when the server comes online.
- **Prerequisites**: Bun 1.4+ installed.

- [ ] **Step 1: Start Relay CLI pointing to an inactive port (e.g. 4329)**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/cli
  bun run src/main.tsx 4329 --no-browser
  ```
  *Verify*: CLI does not exit. It enters the `PortWaiting` state with message:  
  `Target port 4329 is not responding. Waiting for dev server to start...` with an active retry countdown.

- [ ] **Step 2: Start the target dev server on port 4329 in another terminal**
  ```bash
  cd /home/paddy/code/p-s-core/test/fixtures/relay-stress-app
  PORT=4329 bun run server.ts
  ```
  *Verify*: Within 1 second of the server starting, the Relay CLI detects the active port, transitions from `PortWaiting` to `PairingView`, and displays the active QR code and session URL.

---

### Journey 4: Hot Module Replacement (HMR) & Asset Streaming Over Relay Gateway
- **Goal**: Verify that Relay Gateway proxies WebSocket upgrades and rewrites Origin/Host headers so HMR connections don't drop.
- **Prerequisites**: Bun 1.4+ installed.

- [ ] **Step 1: Run Relay Gateway hardening and proxy unit tests**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/cli
  bun test test/gateway-hardening.test.ts
  ```
  *Verify*: All tests pass, including:
  - Multi-receiver connection pool registration.
  - Rate-limiting verification under live HTTP traffic.
  - WebSocket upgrade header sanitization.

- [ ] **Step 2: Start Next.js or Vite dev server**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/local-web
  bun run dev -- -p 3000
  ```

- [ ] **Step 3: Start Relay CLI pointing to port 3000**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/cli
  bun run src/main.tsx 3000 --no-browser
  ```

- [ ] **Step 4: Load Relay Gateway URL in a browser**
  Navigate to `http://127.0.0.1:7331/?relay_token=<TOKEN>`.  
  Inspect browser developer tools console and network tabs.  
  *Verify*: Next.js HMR WebSocket connects to `ws://127.0.0.1:7331/_next/webpack-hmr` or `/_next/hmr` with status `101 Switching Protocols` without connection refusal or CORS violations.

---

### Journey 5: Live In-Browser Telemetry, Floating HUD & Console Mirror
- **Goal**: Verify that the receiver web app displays the floating HUD, tracks real-time ping latency, captures application console messages, and allows log filtering.
- **Prerequisites**: Bun 1.4+ installed.

- [ ] **Step 1: Run receiver component unit tests**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/local-web
  bun test test/receiver.test.ts
  ```
  *Verify*: Tests pass for:
  - Filtering console log events by severity level (`all`, `warn`, `error`).
  - Network latency calculation.

- [ ] **Step 2: Start target test app**
  ```bash
  cd /home/paddy/code/p-s-core/test/fixtures/relay-stress-app
  PORT=4321 bun run server.ts
  ```

- [ ] **Step 3: Start local receiver app**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/local-web
  bun run dev -- -p 3001
  ```

- [ ] **Step 4: Open receiver in browser**
  Navigate to `http://localhost:3001/receiver?target=http://localhost:4321`.  
  *Verify*:
  1. Stress app loads inside the sandbox iframe.
  2. Floating HUD appears at the bottom center with live latency badge (e.g. `8ms` with green indicator).
  3. Click the console button (`⌨`) on the HUD to expand the console drawer.
  4. Trigger logs in the stress app (click "Emit Console Log" button).
  5. Check that the log entry appears in the Console Mirror drawer.
  6. Click "Warn" or "Error" filter buttons to verify log filtering.
  7. Click "Clear" to verify log buffer reset.

---

### Journey 6: Responsive Orientation Simulation & Viewport Switching
- **Goal**: Verify that the receiver HUD allows quick switching between portrait and landscape viewport simulation without changing device hardware orientation.
- **Prerequisites**: Bun 1.4+ installed.

- [ ] **Step 1: Start target test app**
  ```bash
  cd /home/paddy/code/p-s-core/test/fixtures/relay-stress-app
  PORT=4321 bun run server.ts
  ```

- [ ] **Step 2: Start local receiver web app**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/local-web
  bun run dev -- -p 3001
  ```

- [ ] **Step 3: Test orientation toggle in `/receiver`**
  Open `http://localhost:3001/receiver?target=http://localhost:4321`.  
  1. Observe initial portrait orientation (full width).
  2. Click the Rotate button (`↺`) in the Floating HUD.
  3. *Verify*: The iframe smoothly transitions to landscape mode (`max-w-[1024px] aspect-video`), and the HUD orientation icon updates.
  4. Click the Rotate button again to return to portrait mode.

---

### Journey 7: Gateway Security Boundaries (401 Unauthorized & Timing-Safe Token Rejection)
- **Goal**: Verify that unauthorized LAN clients cannot eavesdrop or access proxied dev servers without valid credentials.
- **Prerequisites**: Bun 1.4+ installed.

- [ ] **Step 1: Run gateway cryptographic security tests**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/cli
  bun test test/gateway.test.ts
  ```
  *Verify*: Test passes confirming invalid tokens receive 401 status.

- [ ] **Step 2: Start target dev server**
  ```bash
  cd /home/paddy/code/p-s-core/test/fixtures/relay-stress-app
  PORT=4321 bun run server.ts
  ```

- [ ] **Step 3: Start Relay CLI**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/cli
  bun run src/main.tsx 4321 --no-browser
  ```

- [ ] **Step 4: Attempt unauthenticated request**
  ```bash
  curl -i http://127.0.0.1:7331/
  ```
  *Verify*: HTTP status is `401 Unauthorized`, response contains:  
  `<h1>Pairing Required</h1>` with instructions to scan the terminal QR code.

- [ ] **Step 5: Attempt forged token request**
  ```bash
  curl -i "http://127.0.0.1:7331/?relay_token=forged_token_1234567890"
  ```
  *Verify*: HTTP status is `401 Unauthorized`.

---

### Journey 8: Gateway Defense & Sliding-Window Rate Limiting (429 Too Many Requests)
- **Goal**: Verify that unauthenticated brute-force pairing attempts trigger the sliding-window rate limiter.
- **Prerequisites**: Bun 1.4+ installed.

- [ ] **Step 1: Run rate-limiter unit test**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/cli
  bun test test/gateway-hardening.test.ts -t "rate limiting"
  ```
  *Verify*: Test passes verifying requests exceeding the threshold receive `429 Too Many Requests`.

- [ ] **Step 2: Verify rate limiting in live gateway**
  Start target app and Relay CLI:
  ```bash
  cd /home/paddy/code/p-s-core/test/fixtures/relay-stress-app
  PORT=4321 bun run server.ts &
  cd /home/paddy/code/p-s-core/apps/relay/cli
  bun run src/main.tsx 4321 --no-browser &
  ```
  Execute rapid unauthenticated requests:
  ```bash
  for i in {1..35}; do curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:7331/; done | grep "429" | head -1
  ```
  *Verify*: Output returns `429`, confirming that the rate limiter engaged and protected the gateway.

---

### Journey 9: Target Server Outage / Crash Fallback (502 Target Unavailable)
- **Goal**: Verify that if the upstream development server crashes or terminates mid-session, the gateway delivers an informative 502 status page.
- **Prerequisites**: Bun 1.4+ installed.

- [ ] **Step 1: Start target test app**
  ```bash
  cd /home/paddy/code/p-s-core/test/fixtures/relay-stress-app
  PORT=4321 bun run server.ts
  ```

- [ ] **Step 2: Start Relay CLI**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/cli
  bun run src/main.tsx 4321 --no-browser
  ```

- [ ] **Step 3: Authenticate a session and confirm healthy response**
  Grab the session URL from the CLI and request it via curl saving cookies:
  ```bash
  # Authenticate and store cookie in /tmp/relay-cookie.txt
  curl -c /tmp/relay-cookie.txt -s "http://127.0.0.1:7331/?relay_token=$(curl -s http://127.0.0.1:7331/ | grep -o 'token=[^"]*' | head -1 | cut -d= -f2)"
  curl -b /tmp/relay-cookie.txt -s http://127.0.0.1:7331/ | grep "Relay Stress"
  ```
  *Verify*: Target content is returned.

- [ ] **Step 4: Kill the target test app (simulate server crash)**
  Terminate the `server.ts` process running on port 4321.

- [ ] **Step 5: Refresh or fetch gateway endpoint**
  ```bash
  curl -b /tmp/relay-cookie.txt -i http://127.0.0.1:7331/
  ```
  *Verify*: HTTP status code is `502 Bad Gateway`, containing:  
  `<h1>Service Unavailable</h1>` and `Relay Gateway is active, but your local development server on port 4321 is not responding.`

---

### Journey 10: Headless CI/CD Automated Test Pipeline (`relay ci`)
- **Goal**: Verify that Relay can execute headlessly in CI/CD environments, emit GitHub Actions step notices, run a test suite, write endpoint files, and exit with the child process code.
- **Prerequisites**: Bun 1.4+ installed.

- [ ] **Step 1: Run Relay CI runner unit tests**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/cli
  bun test test/ci-runner.test.ts
  ```
  *Verify*: All tests pass:
  - Argument parsing for `relay ci`.
  - Machine-readable metadata generation.
  - Endpoint file writing.
  - Child process exit code propagation.

- [ ] **Step 2: Execute an automated CI run with child command execution**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/cli
  bun run src/main.tsx ci 4321 --command "echo 'Running CI tests against tunnel' && exit 0" --output-file "/tmp/relay-ci-meta.env"
  ```
  *Verify*:
  1. Terminal outputs GitHub Actions annotation:  
     `::notice title=Relay CI::Tunnel active at https://ci_....relay.paddy.systems`
  2. Terminal displays environment variables: `RELAY_SESSION_ID`, `RELAY_TUNNEL_URL`, `RELAY_GATEWAY_URL`.
  3. File `/tmp/relay-ci-meta.env` exists and contains endpoint values.
  4. Command exits with code 0.

- [ ] **Step 3: Execute failing child command to verify error code propagation**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/cli
  bun run src/main.tsx ci 4321 --command "exit 42"
  ```
  *Verify*: Process terminates with exit code 42.

---

### Journey 11: Shell Tab-Completion Generation (Bash / Zsh / Fish)
- **Goal**: Verify that shell auto-completion scripts are correctly generated for bash, zsh, and fish.
- **Prerequisites**: Bun 1.4+ installed.

- [ ] **Step 1: Test Bash completion script output**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/cli
  bun run src/main.tsx completion bash
  ```
  *Verify*: Output contains `complete -F _relay_completion relay` and option flags (`--host`, `--gateway-port`, `--no-browser`, `--large-qr`).

- [ ] **Step 2: Test Zsh completion script output**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/cli
  bun run src/main.tsx completion zsh
  ```
  *Verify*: Output contains `#compdef relay` and `_arguments` declarations.

- [ ] **Step 3: Test Fish completion script output**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/cli
  bun run src/main.tsx completion fish
  ```
  *Verify*: Output contains `complete -c relay` definitions.

---

### Journey 12: Firewall Port Audit & Detection Simulation
- **Goal**: Verify that the host firewall auditor correctly evaluates firewall state across Linux, macOS, and Windows.
- **Prerequisites**: Bun 1.4+ installed.

- [ ] **Step 1: Run Linux UFW firewall adapter tests**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/cli
  bun test test/firewall/ufw.test.ts
  ```
  *Verify*: Tests pass for active/inactive state, blocked port detection, and remediation command generation (`sudo ufw allow 7331/tcp`).

- [ ] **Step 2: Run Linux Firewalld adapter tests**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/cli
  bun test test/firewall/firewalld.test.ts
  ```
  *Verify*: Tests pass for `firewall-cmd --query-port` checks and remediation generation.

- [ ] **Step 3: Run macOS firewall adapter tests**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/cli
  bun test test/firewall/macos.test.ts
  ```
  *Verify*: Tests pass for `socketfilterfw` checking.

- [ ] **Step 4: Run Windows netsh/PowerShell firewall adapter tests**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/cli
  bun test test/firewall/windows.test.ts
  ```
  *Verify*: Tests pass for netsh rule detection and elevated PowerShell remediation command generation.

---

### Journey 13: Terminal Interactive TUI Navigation (Receivers, Status, Stream, Config)
- **Goal**: Verify that a user can interact with the Ink TUI via keyboard navigation to inspect connected devices, status, event stream, and configuration.
- **Prerequisites**: Bun 1.4+ installed, interactive terminal.

- [ ] **Step 1: Start target test dev server**
  ```bash
  cd /home/paddy/code/p-s-core/test/fixtures/relay-stress-app
  PORT=4321 bun run server.ts
  ```

- [ ] **Step 2: Launch Relay CLI**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/cli
  bun run src/main.tsx 4321 --no-browser
  ```

- [ ] **Step 3: Navigate Menu Items via Arrow Keys / Numbers**
  1. Press `Down Arrow` or `2`: Switch to `Connected Receivers`. Verify table headers `ID`, `IP`, `PLATFORM`, `PING`.
  2. Press `Down Arrow` or `3`: Switch to `Relay Status`. Verify gateway port indicator, upstream dev server status, and LAN interface.
  3. Press `Down Arrow` or `4`: Switch to `Stream Events`. Verify active event stream viewer.
  4. Press `Down Arrow` or `5`: Switch to `Configuration`. Verify displayed options (`targetPort: 4321`, `gatewayPort: 7331`).
  5. Press `1`: Return to `Pair Device (QR)`. Verify QR code is re-rendered.
  6. Press `q` or `Ctrl+C`: Gracefully shuts down gateway and exits with code 0.

---

### Journey 14: Cloud Web Dashboard & Team Session Telemetry Verification
- **Goal**: Verify that the Cloud Web dashboard displays active multi-developer session feeds, calculates telemetry statistics, and filters sessions by project and branch.
- **Prerequisites**: Bun 1.4+ installed.

- [ ] **Step 1: Run team session feed unit tests**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/cloud-web
  bun test test/team-feed.test.ts
  ```
  *Verify*: Tests pass for filtering sessions by keyword (developer name, branch, project) and status (live vs idle).

- [ ] **Step 2: Run cloud dashboard telemetry unit tests**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/cloud-web
  bun test test/dashboard.test.ts
  ```
  *Verify*: Tests pass for:
  - Telemetry statistics calculations.
  - Audit log filtering.
  - Device trust score threshold evaluations.
  - Team role hierarchy enforcement.

---

### Journey 15: Session Annotation & Screen Drawing Canvas Verification
- **Goal**: Verify that collaborative drawing annotations (rectangles, arrows, freehand lines) work over live remote viewports.
- **Prerequisites**: Bun 1.4+ installed.

- [ ] **Step 1: Run annotation canvas unit tests**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/cloud-web
  bun test test/annotation-canvas.test.ts
  ```
  *Verify*: Tests pass for:
  - Adding, retrieving, and clearing annotations.
  - Serializing and restoring annotations across sessions.
  - 2D Canvas rendering operations without errors.

---

### Journey 16: Shared Team Device Farm Exclusive Locking & Telemetry Verification
- **Goal**: Verify that the shared device farm tracks device inventory, enforces single-engineer exclusive locking, and reports live battery/charging telemetry.
- **Prerequisites**: Bun 1.4+ installed.

- [ ] **Step 1: Run device farm unit tests**
  ```bash
  cd /home/paddy/code/p-s-core/apps/relay/cloud-web
  bun test test/device-farm.test.ts
  ```
  *Verify*: Tests pass for:
  - Device registration and exclusive locking management.
  - Preventing acquisition of offline devices.
  - Real-time battery telemetry and charging state updates.
