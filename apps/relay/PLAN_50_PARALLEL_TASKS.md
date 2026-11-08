# Relay: 50 Parallel Tasks Implementation Plan

> **Roadmap Strategy**: Fully Decoupled & Parallelizable Workstreams (Client-side Agent, Capabilities, CLI Packaging & DX, Security & Commercial, and Documentation & Chaos Testing).
> **Source of Truth Reference**: [`apps/relay/RELAY_DEVELOPMENT_CHECKLIST.md`](./RELAY_DEVELOPMENT_CHECKLIST.md)
> **Companion Plan**: [`apps/relay/PLAN_100_TASKS.md`](./PLAN_100_TASKS.md)
> **Architectural Standard**: `~/.config/agents/engineering.md`

---

## Strategic Objective

While the primary runtime track executes the sequential host-to-receiver gateway and tunnel pipeline in [`PLAN_100_TASKS.md`](./PLAN_100_TASKS.md), this companion plan captures **50 concrete, high-leverage tasks** from the master checklist that can be developed and verified **immediately without waiting for the primary 100 tasks**.

These tasks have zero code coupling with the active in-flight work in `apps/relay/cli` or `apps/relay/local-web`, allowing concurrent execution by independent agents or engineers.

---

## Epic Index (50 Tasks Total)

1. [Epic A: Browser Agent Bootstrap & Injection Engine (`TASK-P01` - `TASK-P10`)](#epic-a-browser-agent-bootstrap--injection-engine-task-p01---task-p10)
2. [Epic B: Capability Taxonomy, Device Detection & Diagnostics (`TASK-P11` - `TASK-P20`)](#epic-b-capability-taxonomy-device-detection--diagnostics-task-p11---task-p20)
3. [Epic C: Developer Experience, Platform Adapters & CLI Packaging (`TASK-P21` - `TASK-P30`)](#epic-c-developer-experience-platform-adapters--cli-packaging-task-p21---task-p30)
4. [Epic D: Security Governance, Abuse Prevention & Commercial Data Models (`TASK-P31` - `TASK-P40`)](#epic-d-security-governance-abuse-prevention--commercial-data-models-task-p31---task-p40)
5. [Epic E: Documentation, Developer Guides & Chaos Testing Fixtures (`TASK-P41` - `TASK-P50`)](#epic-e-documentation-developer-guides--chaos-testing-fixtures-task-p41---task-p50)

---

## Epic A: Browser Agent Bootstrap & Injection Engine (`TASK-P01` - `TASK-P10`) [COMPLETE]

**Checklist Reference**: Section 18 (*Browser agent bootstrap*) & Section 7 (*Session event system*)
**Target Workspace**: `packages/relay-agent` (`@paddy-systems/relay-agent`)
**Decoupling Rationale**: Standalone client-side script running inside target browser to capture DOM/console/network events; tested against static HTML pages without requiring active CLI gateway.

- [x] **TASK-P01: Browser Agent Package Scaffold & Standalone Bundle Setup**
  - *Scope*: Initialize `@paddy-systems/relay-agent` with Vite/tsup build configuration producing both an IIFE standalone script and ESM module `< 15kB` gzipped.
  - *Criteria*: Package builds cleanly under `bun run check-types`; bundle executes in browser global context without polluting global namespace or colliding with host application variables.
- [x] **TASK-P02: Console Log Interceptor & Redaction Engine**
  - *Scope*: Wrap `console.log`, `console.info`, `console.warn`, `console.error`, and `console.debug`. Safely serialize circular objects, DOM nodes, Error instances, and stack traces with PII masking (passwords, tokens, bearer secrets).
  - *Criteria*: Serialization tests confirm circular references do not trigger `Maximum call stack size exceeded` and sensitive auth patterns are redacted.
- [x] **TASK-P03: Network Fetch & XHR Interceptor**
  - *Scope*: Wrap `window.fetch` and `XMLHttpRequest.prototype.send` to capture HTTP method, target URL, request/response headers, status code, timing (TTFB, total duration), and payload size.
  - *Criteria*: Interceptor tracks request lifecycle accurately and fails open gracefully on CORS or network errors without breaking host application data fetching.
- [x] **TASK-P04: Window Error & Unhandled Rejection Sniffer**
  - *Scope*: Install global listeners for `window.onerror` and `window.onunhandledrejection` to normalize runtime script exceptions into typed protocol event payloads.
  - *Criteria*: Emits structured error events with sanitized stack trace, filename, line, and column coordinates.
- [x] **TASK-P05: Client Viewport & Resize Observer**
  - *Scope*: Implement observers tracking viewport dimensions (`innerWidth`, `innerHeight`), device pixel ratio (`window.devicePixelRatio`), orientation (`portrait` vs `landscape`), and debounced scroll position.
  - *Criteria*: Viewport changes emit debounced events at maximum 60Hz without layout thrashing.
- [x] **TASK-P06: Touch & Pointer Event Tracker**
  - *Scope*: Record normalized touch and click coordinates relative to viewport (`x%`, `y%`), touch radius, and multi-touch count for real-time touch ripple visualization.
  - *Criteria*: Emits normalized pointer traces with zero perceptible degradation to scrolling performance.
- [x] **TASK-P07: Next.js & Vite Script Injection Helper**
  - *Scope*: Provide `<RelayAgent />` React component for Next.js and `relayPlugin()` for Vite dev servers for developers who prefer direct dev-mode inclusion over reverse-proxy injection.
  - *Criteria*: Component renders only when `process.env.NODE_ENV === 'development'` and is completely stripped from production builds.
- [x] **TASK-P08: CSP (Content Security Policy) Compatibility & Nonce Injector**
  - *Scope*: Build CSP header analyzer and nonce propagator ensuring the agent script executes smoothly in target apps with strict `script-src` policies.
  - *Criteria*: Test page with strict `Content-Security-Policy: default-src 'self'` loads agent using supplied nonce without browser console policy violations.
- [x] **TASK-P09: In-Memory Ring Buffer & Transport Emitter Interface**
  - *Scope*: Buffer up to 500 events in a circular in-memory buffer while offline, and emit ordered batches immediately upon transport channel attachment.
  - *Criteria*: Ring buffer drops oldest frames on overflow; delivers sequential, gapless event frames when transport connects.
- [x] **TASK-P10: Standalone Agent Test Harness**
  - *Scope*: Create Vitest + JSDOM / Playwright test harness verifying agent behavior against real DOM mutations, synthetic network requests, and thrown exceptions.
  - *Criteria*: 100% test pass rate across synthetic browser interactions with zero memory leaks.

---

## Epic B: Capability Taxonomy, Device Detection & Diagnostics (`TASK-P11` - `TASK-P20`) [COMPLETE]

**Checklist Reference**: Section 6 (*Capability system*), Section 20 (*Error handling*), Section 19 (*Screen capture*)
**Target Workspace**: `packages/relay-capabilities` (`@paddy-systems/relay-capabilities`)
**Decoupling Rationale**: Pure domain data structures, client feature-detection heuristics, and user-facing error message catalogs that run side-effect-free in isolation.

- [x] **TASK-P11: Capability Schema Specification**
  - *Scope*: Define Zod schemas and TypeScript interfaces for client capabilities: DOM, Console, Network, Screenshot, ScreenRecording, Haptics, Geolocation, Battery, and WebGL.
  - *Criteria*: Strict validation ensuring receivers cannot declare malformed capability descriptors or unsupported version ranges.
- [x] **TASK-P12: Browser Feature Detection Suite**
  - *Scope*: Implement pure browser detection utilities probing `navigator.mediaDevices.getDisplayMedia`, `navigator.vibrate`, `window.EyeDropper`, Battery Status API, and touch input support.
  - *Criteria*: Side-effect-free detector returning boolean capability record in `< 2ms` on initial page load.
- [x] **TASK-P13: Capability Negotiation Resolver**
  - *Scope*: Pure reconciliation function taking host capabilities and receiver capabilities to compute the active operational feature set.
  - *Criteria*: Resolves lowest common denominator deterministically (e.g. disables screen recording if receiver lacks MediaDevices).
- [x] **TASK-P14: Unsupported Operation Fallback Handler**
  - *Scope*: Standardized protocol response generator for when an unavailable feature is requested by either host or receiver.
  - *Criteria*: Emits typed `ERR_UNSUPPORTED_CAPABILITY` payload with diagnostic remediation advice for UI presentation.
- [x] **TASK-P15: Device Metadata & User-Agent Parser**
  - *Scope*: Lightweight, zero-dependency parser identifying human-readable device model (e.g. "iPhone 15 Pro", "Pixel 8", "MacBook Pro M3") and OS version from user-agent and client hints.
  - *Criteria*: Correctly identifies top 30 mobile and desktop platforms without heavy external user-agent libraries.
- [x] **TASK-P16: User-Facing Diagnostic Error Catalog**
  - *Scope*: Exhaustive dictionary mapping all protocol and transport error codes to user-friendly titles, explanations, and actionable next steps.
  - *Criteria*: Covers target port unreachable, firewall block, token expiration, missing LAN interface, and tunnel timeout with zero generic unhandled errors.
- [x] **TASK-P17: Screen Capture Feasibility Matrix & Permission Guide**
  - *Scope*: Document and implement capability checks distinguishing between DOM replay, browser tab capture, and OS physical screen capture per platform.
  - *Criteria*: Returns permission state (`granted`, `prompt`, `denied`, `unsupported`) across mobile Safari, mobile Chrome, and desktop.
- [x] **TASK-P18: Battery & Thermal Impact Throttler**
  - *Scope*: Client-side observer querying Battery API to recommend reduced telemetry sampling rates when battery is `< 20%` or charging status is false.
  - *Criteria*: Emits throttle recommendation events based on battery level to preserve mobile device battery during long debug sessions.
- [x] **TASK-P19: WebGL & Canvas Rendering Check**
  - *Scope*: Lightweight probe verifying whether receiver hardware supports GPU-accelerated Canvas/WebGL for rendering device overlays and UI annotations.
  - *Criteria*: Probe completes in `< 5ms` without leaving dangling WebGL contexts or leaking VRAM.
- [x] **TASK-P20: Capabilities & Diagnostics Test Suite**
  - *Scope*: Comprehensive unit tests covering mock device profiles (iOS Safari, Android Chrome, Firefox, headless CLI).
  - *Criteria*: 100% code coverage on capability negotiation, user-agent parsing, and error dictionary mappings.

---

## Epic C: Developer Experience, Platform Adapters & CLI Packaging (`TASK-P21` - `TASK-P30`) [COMPLETE]

**Checklist Reference**: Section 25 (*Developer experience*) & Section 29 (*Release engineering*)
**Target Workspace**: `apps/relay/cli` & `scripts/`
**Decoupling Rationale**: OS compatibility shims, shell completions, packaging scripts, and compilation targets wrap around the CLI binary without altering runtime gateway logic.

- [x] **TASK-P21: Standalone Single-Binary Compilation Script (Bun Compile)**
  - *Scope*: Create build script using `bun build --compile` generating standalone self-contained binaries for Linux (x64/arm64) and macOS (arm64/x64).
  - *Criteria*: Binary executes cleanly on a machine without Bun or Node installed; outputs `--help` in `< 30ms`.
- [x] **TASK-P22: Windows WSL & Hyper-V Adapter Discovery**
  - *Scope*: Implement network detector specifically identifying WSL2 virtual interfaces (`vEthernet`) and mapping them back to the Windows host machine's physical Wi-Fi adapter IP.
  - *Criteria*: Correctly prints reachable Windows host IP when run inside WSL2 instead of unreachable internal bridge IP (`172.x.x.x`).
- [x] **TASK-P23: Shell Autocompletion Generator (Bash, Zsh, Fish)**
  - *Scope*: Implement `relay completion <shell>` command outputting tab-completion scripts for ports, flags (`--no-browser`, `--https`, `--port`).
  - *Criteria*: Generated completion scripts source cleanly in bash, zsh, and fish shells.
- [x] **TASK-P24: Terminal Resize & Reflow Handler**
  - *Scope*: Add `process.stdout.on('resize')` listener to CLI UI calculating columns and rows, gracefully collapsing tables and status pills on narrow terminals (< 80 columns).
  - *Criteria*: Resizing terminal does not crash Ink runtime or corrupt QR ASCII block rendering.
- [x] **TASK-P25: Non-Interactive / CI Output Mode**
  - *Scope*: Add `--json` flag to CLI outputting newline-delimited JSON events for session creation, connection events, and errors.
  - *Criteria*: Piping `relay 3000 --json` outputs parseable JSON streams without ANSI escape codes.
- [x] **TASK-P26: CLI Version & Self-Update Checker**
  - *Scope*: Implement background non-blocking check against npm registry / GitHub Releases alerting developer if a newer CLI version exists.
  - *Criteria*: Check runs asynchronously with a 1.5s timeout; never blocks CLI startup or adds latency to initial QR generation.
- [x] **TASK-P27: Node.js Compatibility Wrapper**
  - *Scope*: Provide `dist/bin.js` entry point allowing the CLI to run under Node 20+ via `npx @paddy-systems/relay` without requiring Bun globally.
  - *Criteria*: `npx` execution boots CLI with full functionality and correct exit code handling.
- [x] **TASK-P28: System Keychain Credential Helper**
  - *Scope*: Build credential storage adapter with backends for macOS Keychain, Windows Credential Store, and Secret Service (Linux), falling back to encrypted file permissions `0600`.
  - *Criteria*: Stores and retrieves session secrets securely without plaintext disk exposure.
- [x] **TASK-P29: Package Manager Installation Commands Generator**
  - *Scope*: Build helper that detects active package manager (`pnpm`, `bun`, `npm`, `yarn`) in target project and formats appropriate execution commands.
  - *Criteria*: Suggests `bunx relay` or `npx relay` dynamically based on project lockfile detection.
- [x] **TASK-P30: CLI Cross-Platform Smoke Test Harness**
  - *Scope*: Create CI test script asserting binary execution across Linux and macOS runners with mock upstream servers.
  - *Criteria*: Test passes in GitHub Actions matrix in < 15 seconds with zero orphaned child processes.

---

## Epic D: Security Governance, Abuse Prevention & Commercial Data Models (`TASK-P31` - `TASK-P40`) [COMPLETE]

**Checklist Reference**: Section 11 (*Authentication & authorization*), Section 13 (*Billing*), Section 24 (*Security testing*), Section 28 (*Billing & commercial launch*)
**Target Workspace**: `packages/shared`, `packages/relay-billing`, `docs/legal/`
**Decoupling Rationale**: Pricing models, quota evaluation rules, legal agreements, and threat-modeling test fixtures are independent specifications that precede cloud deployment.

- [x] **TASK-P31: Stripe Product & Price Catalog Specification**
  - *Scope*: Create declarative Stripe product definitions for Solo ($12/mo) and Teams ($29/seat/mo, min 3 seats) with multi-currency mappings (USD, GBP, EUR).
  - *Criteria*: Type-checked TypeScript configuration matching Stripe API payload specifications and metadata tags.
- [x] **TASK-P32: Entitlement & Quota Verification Engine**
  - *Scope*: Pure library evaluating user/team subscription tier against resource requests: concurrent sessions, recording storage retention (7d vs 30d vs 90d), and bandwidth limits.
  - *Criteria*: Unit tests verify Solo tier is capped at 2 concurrent sessions and Teams at tier seat count.
- [x] **TASK-P33: SSRF (Server-Side Request Forgery) Prevention Filter**
  - *Scope*: Implement IP validator rejecting loopback targets (e.g. AWS metadata `169.254.169.254`, private cloud subnets) when running in remote relay mode.
  - *Criteria*: Blocks requests targeting cloud internal metadata endpoints with typed security error.
- [x] **TASK-P34: Short-Code Entropy & Collision Resistance Calculator**
  - *Scope*: Build entropy validator and test harness calculating collision probability of 6-character short codes under concurrent session volumes.
  - *Criteria*: Mathematical simulation confirms < 0.01% collision chance across 50,000 active concurrent sessions with 15-minute TTL.
- [x] **TASK-P35: Cryptographic Timing Attack Defense Tests**
  - *Scope*: Create statistical timing-attack test suite asserting `timingSafeEqual` against randomized token inputs.
  - *Criteria*: Confirms delta in comparison timing between correct prefix vs random string is statistically indistinguishable.
- [x] **TASK-P36: Relay Terms of Service Document**
  - *Scope*: Draft comprehensive Terms of Service covering acceptable use, dev tunnel proxying, reverse engineering prohibitions, and service availability disclaimers.
  - *Criteria*: Markdown artifact in `docs/legal/TERMS_OF_SERVICE.md` ready for legal review.
- [x] **TASK-P37: Relay Privacy Policy & Data Retention Policy**
  - *Scope*: Document privacy policy specifying that Local Relay transmits zero telemetry to cloud, and defining retention limits for Cloud recordings.
  - *Criteria*: Markdown artifact in `docs/legal/PRIVACY_POLICY.md` specifying data deletion timelines and GDPR compliance guarantees.
- [x] **TASK-P38: Security Audit Event Schema**
  - *Scope*: Define structured JSON schemas for security-relevant events: `AUTH_SUCCESS`, `AUTH_FAILURE`, `SHORT_CODE_BRUTE_FORCE_ATTEMPT`, `TOKEN_REVOKED`, `POLICY_VIOLATION`.
  - *Criteria*: Zod schema with strict typing, actor context, source IP, and ISO 8601 timestamp.
- [x] **TASK-P39: Automated Security Dependency Scanner Setup**
  - *Scope*: Script running `bun pm audit` / `osv-scanner` across all Relay dependencies to verify zero known CVEs.
  - *Criteria*: Script fails with exit code 1 if dependencies have high/critical CVEs.
- [x] **TASK-P40: Abuse Prevention Token Bucket Rate Limiter Library**
  - *Scope*: Extract generic, dependency-free token bucket rate limiter with sliding expiration into `packages/shared/utils`.
  - *Criteria*: 100% unit test coverage verifying burst allowances and smooth replenishment.

---

## Epic E: Documentation, Developer Guides & Chaos Testing Fixtures (`TASK-P41` - `TASK-P50`) [COMPLETE]

**Checklist Reference**: Section 26 (*Documentation*), Section 23 (*Testing strategy*), Section 20 (*Error handling*)
**Target Workspace**: `apps/relay/local-web/app/docs`, `docs/relay/`, `test/fixtures/`
**Decoupling Rationale**: Technical documentation, architecture decision records, troubleshooting trees, and mock target apps provide immediate value and require zero changes to application code.

- [x] **TASK-P41: Architecture Decision Record (ADR-001): Dual Local/Remote Model**
  - *Scope*: Author formal ADR documenting why Local Relay is permanently free and direct LAN-only, while Remote is cloud-brokered.
  - *Criteria*: Committed to `docs/adr/ADR-001-relay-local-vs-remote.md` following standard ADR format.
- [x] **TASK-P42: Architecture Decision Record (ADR-002): Binary vs JSON Framing**
  - *Scope*: Author formal ADR documenting the protocol envelope specification, framing rationale, and performance benchmarks over WebSocket/WebRTC.
  - *Criteria*: Committed to `docs/adr/ADR-002-protocol-framing.md`.
- [x] **TASK-P43: Interactive Network Troubleshooting Decision Tree**
  - *Scope*: Build interactive troubleshooting component or markdown guide diagnosing why a phone can't reach host machine (AP isolation, VPN, firewall, subnet mismatch).
  - *Criteria*: Guides user through step-by-step resolution based on their OS and router setup.
- [x] **TASK-P44: Framework Integration Guide: Next.js (App & Pages Router)**
  - *Scope*: Write comprehensive guide for running Relay alongside Next.js 14/15/16 dev servers, HMR considerations, and image optimization proxying.
  - *Criteria*: Clear guide published in docs workspace with tested code examples.
- [x] **TASK-P45: Framework Integration Guide: Vite & Turbopack**
  - *Scope*: Write guide for configuring Vite (`server.host: true`) and Turbopack dev servers for seamless Relay pairing.
  - *Criteria*: Step-by-step guide with verified configuration snippets.
- [x] **TASK-P46: Synthetic Target App Fixture (The "Relay Stress App")**
  - *Scope*: Build lightweight static/React demo app containing rapid DOM mutations, heavy console output, 4xx/5xx network requests, and CSS animations.
  - *Criteria*: Single command starts test app on port 3099; used for stress-testing any Relay receiver.
- [x] **TASK-P47: Mobile Browser Compatibility Matrix**
  - *Scope*: Document supported mobile browser versions (iOS Safari 15+, Android Chrome 110+, Samsung Internet, Firefox Mobile) and known quirks (safe area insets, touch event delay).
  - *Criteria*: Markdown matrix in `docs/relay/BROWSER_COMPATIBILITY.md`.
- [x] **TASK-P48: Network Chaos Simulation Scripts**
  - *Scope*: Create helper script using Linux `tc` (traffic control) / `pfctl` (macOS) to simulate 3G network latency (250ms), jitter (50ms), and packet loss (5%).
  - *Criteria*: Easy start/stop shell scripts for validating Relay under degraded network conditions.
- [x] **TASK-P49: Relay Concept Architecture Diagrams (Mermaid)**
  - *Scope*: Create sequence diagrams documenting the full pairing handshake, connection upgrade, event multiplexing, and reconnection flows.
  - *Criteria*: Renderable Mermaid diagrams embedded in documentation.
- [x] **TASK-P50: Relay CLI Manpage & Help Markdown Generator**
  - *Scope*: Script generating Unix `relay.1` manpage and synchronized CLI docs table in README from CLI argument schema.
  - *Criteria*: Running script updates docs automatically without drift from code.

---

## Execution Tracker

| Epic | Tasks | Focus Area | Status |
| :--- | :--- | :--- | :--- |
| **Epic A** | `TASK-P01` - `TASK-P10` | Browser Agent Bootstrap & Injection Engine | **COMPLETE (10/10)** |
| **Epic B** | `TASK-P11` - `TASK-P20` | Capability Taxonomy, Device Detection & Diagnostics | **COMPLETE (10/10)** |
| **Epic C** | `TASK-P21` - `TASK-P30` | Developer Experience, Platform Adapters & CLI Packaging | **COMPLETE (10/10)** |
| **Epic D** | `TASK-P31` - `TASK-P40` | Security Governance, Abuse Prevention & Commercial Data Models | **COMPLETE (10/10)** |
| **Epic E** | `TASK-P41` - `TASK-P50` | Documentation, Developer Guides & Chaos Testing Fixtures | **COMPLETE (10/10)** |
