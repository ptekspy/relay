Yes. I’d make this the **master Relay development checklist** — from architecture through launch, without turning it into implementation yet.

The important distinction is that this is a **product/development checklist**, not a list of arbitrary Jira tickets. We can later break these sections into epics → stories → tasks.

# Relay — Master Development Checklist

## 0. Product & architectural foundations

### Product model

- [ ] Define `RelaySession`
- [ ] Define `RelayConnection`
- [ ] Define `RelayReceiver`
- [ ] Define receiver capabilities
- [ ] Define `RelayHost`
  - [ ] LOCAL
  - [ ] REMOTE
- [ ] Define dashboard surfaces
  - [ ] Web Local
  - [ ] Web Cloud
  - [ ] CLI
- [ ] Define connection mechanisms
  - [x] QR
  - [x] Short code
  - [ ] Email invite
- [ ] Define session access policies
  - [ ] Open
  - [ ] Team-only
- [ ] Define session lifecycle
- [ ] Define connection lifecycle
- [ ] Define receiver lifecycle
- [ ] Define recording lifecycle

### Fundamental rules

- [ ] LOCAL is permanently free
- [ ] LOCAL requires no account
- [ ] LOCAL is live-only
- [ ] REMOTE requires cloud infrastructure
- [ ] REMOTE is subscription-based
- [ ] Every REMOTE connection is independently replayable
- [x] QR/short-code possession does not bypass access policy
- [ ] No USB in the normal Relay workflow
- [ ] No ADB/scrcpy dependency in the core product
- [ ] Browser/mobile browser is the primary receiver experience

---

# 1. Repository & package architecture

- [x] Establish Relay workspace structure
- [ ] Define application/package ownership
- [ ] Define dependency boundaries
- [ ] Define public vs private packages
- [ ] Define package naming
- [ ] Define versioning strategy
- [ ] Define build strategy
- [ ] Define test strategy
- [ ] Define release strategy

### Applications

- [x] `relay-cli`
- [x] `relay-web-local`
- [x] `relay-web-cloud`
- [x] `relay-cloud-api`
- [ ] `relay-cloud-edge`

### Core packages

- [ ] `relay-core`
- [ ] `relay-protocol`
- [ ] `relay-transport`
- [ ] `relay-tunnel`
- [ ] `relay-agent`
- [ ] `relay-recording`
- [ ] `relay-replay`
- [ ] `relay-ui`
- [ ] `relay-cli-ui`

### Dependency review

For every proposed dependency:

- [ ] Confirm existing library actually solves the problem
- [ ] Confirm licence
- [ ] Confirm maintenance/activity
- [ ] Confirm browser compatibility
- [ ] Confirm Node compatibility
- [ ] Confirm bundle-size implications
- [ ] Confirm security implications
- [ ] Avoid recreating existing functionality unnecessarily

---

# 2. Relay protocol

This is one of the **core Paddy Systems-owned pieces**.

### Protocol foundation

- [ ] Define protocol version
- [ ] Define message envelope
- [ ] Define message IDs
- [ ] Define timestamps
- [ ] Define session IDs
- [ ] Define connection IDs
- [ ] Define receiver IDs
- [ ] Define correlation/request IDs
- [ ] Define protocol errors
- [ ] Define protocol capabilities

### Session messages

- [ ] Session creation
- [ ] Session created
- [ ] Session closed
- [ ] Session state
- [ ] Session metadata update

### Connection messages

- [x] Connection request
- [x] Connection accepted
- [x] Connection rejected
- [x] Connection authenticated
- [x] Connection closed
- [x] Connection heartbeat
- [x] Connection error

### Receiver messages

- [ ] Receiver identification
- [ ] Receiver metadata
- [ ] Receiver capabilities
- [ ] Capability changes
- [ ] Receiver state

### Event messages

- [ ] Event envelope
- [ ] Event timestamps
- [ ] Event sequencing
- [ ] Event ordering
- [ ] Event acknowledgement strategy
- [ ] Event batching
- [ ] Event compression

### Control messages

- [ ] Control request
- [ ] Control response
- [ ] Control error
- [ ] Capability-aware controls

### Protocol reliability

- [ ] Reconnection semantics
- [ ] Duplicate event handling
- [ ] Lost event handling
- [ ] Ordering guarantees
- [ ] Backpressure
- [ ] Timeout behaviour
- [ ] Protocol version compatibility

---

# 3. Local Relay

## CLI startup

- [x] `relay <port>`
- [x] Validate target port
- [x] Validate target availability
- [x] Start Relay session
- [x] Generate session identity
- [x] Detect local network interfaces
- [x] Determine reachable LAN address
- [x] Start local transport
- [ ] Start local dashboard server

## Browser behaviour

- [x] Detect internet connectivity
- [x] Open Cloud dashboard when appropriate
- [x] Fall back to Local dashboard when offline
- [x] Support `--no-browser`
- [ ] Handle browser already open
- [ ] Handle dashboard unavailable

## Local dashboard

- [ ] Session information
- [ ] Target information
- [x] QR code
- [x] Short code
- [ ] Install/launch command
- [ ] Receiver list
- [x] Receiver status
- [ ] Live session
- [ ] Console
- [ ] Network
- [ ] DOM/replay view
- [ ] Device capabilities
- [ ] Available controls
- [ ] Session termination

## Local networking

- [ ] LAN discovery/addressing
- [ ] Receiver handshake
- [ ] Local authentication model
- [x] Connection expiry
- [ ] Multiple simultaneous receivers
- [ ] Network change handling
- [ ] Wi-Fi disconnect handling
- [ ] Host shutdown handling

---

# 4. Remote Relay

## Cloud session creation

- [ ] Authenticate user
- [ ] Check subscription entitlement
- [ ] Create remote session
- [ ] Assign session ID
- [ ] Assign cloud routing information
- [ ] Establish persistent host connection

## Cloud edge

- [ ] Host registration
- [ ] Receiver registration
- [ ] Session routing
- [ ] Persistent connections
- [ ] Multiplexed streams
- [ ] Heartbeats
- [ ] Reconnection
- [ ] Host disconnect handling
- [ ] Receiver disconnect handling
- [ ] Session cleanup
- [ ] Edge scaling

## Remote tunnel

- [ ] HTTP traffic
- [ ] WebSocket traffic
- [ ] Request routing
- [ ] Response routing
- [x] Connection persistence
- [ ] Streaming responses
- [ ] Large responses
- [ ] Binary data
- [ ] Timeouts
- [ ] Backpressure
- [ ] Failure recovery

---

# 5. Receiver system

This deserves its own major epic because Relay isn't limited to one receiver.

## Receiver handshake

- [ ] Receiver identifies itself
- [ ] Receiver declares type
- [ ] Receiver declares version
- [ ] Receiver declares capabilities
- [ ] Receiver receives session configuration
- [ ] Receiver establishes event stream
- [ ] Receiver establishes control stream

## Desktop browser

- [x] Connect
- [ ] Identify browser
- [ ] Capture DOM
- [ ] Capture mutations
- [ ] Capture console
- [ ] Capture network
- [ ] Capture navigation
- [ ] Capture interactions
- [ ] Capture viewport
- [ ] Capture orientation
- [ ] Report performance data
- [ ] Support supported controls

## Mobile browser

- [x] Connect
- [ ] Identify device/browser
- [ ] DOM recording
- [ ] Console
- [ ] Network
- [ ] Navigation
- [ ] Touch/input events
- [ ] Viewport
- [ ] Orientation
- [ ] Mobile-specific capabilities
- [ ] Mobile-specific limitations

## Android app

- [ ] Define Android receiver architecture
- [ ] Define authentication
- [ ] Define connection lifecycle
- [ ] Define capabilities
- [ ] Define event capture
- [ ] Define screen capture capability
- [ ] Define device controls
- [ ] Define app lifecycle
- [ ] Define background behaviour
- [ ] Define permissions

## iOS app

- [ ] Define iOS receiver architecture
- [ ] Define authentication
- [ ] Define connection lifecycle
- [ ] Define capabilities
- [ ] Define event capture
- [ ] Define screen capture capability
- [ ] Define device controls
- [ ] Define app lifecycle
- [ ] Define background behaviour
- [ ] Define permissions

## CLI receiver

- [ ] CLI handshake
- [ ] CLI authentication
- [ ] Capability reporting
- [ ] Event stream
- [ ] Control stream
- [x] Connection lifecycle

---

# 6. Capability system

This is important enough to be a dedicated subsystem.

- [ ] Define capability schema
- [ ] Define capability discovery
- [ ] Define capability negotiation
- [ ] Define capability changes
- [ ] Define unsupported-operation response
- [ ] Define UI mapping from capability → control

Potential capabilities:

- [ ] DOM
- [ ] Console
- [ ] Network
- [ ] Screenshot
- [ ] Screen recording
- [ ] Navigation
- [ ] Reload
- [ ] Back
- [ ] Forward
- [ ] Viewport
- [ ] Orientation
- [ ] Touch/input
- [ ] Device metadata
- [ ] Performance
- [ ] Storage inspection
- [ ] Cookies
- [ ] App-specific capabilities

We **must not assume** a capability merely because something identifies itself as Android/iOS/browser.

---

# 7. Session event system

This is the heart of the observability side.

- [ ] Define event envelope
- [ ] Define event categories
- [ ] Define event timestamps
- [ ] Define event ordering
- [ ] Define event source
- [ ] Define connection ownership
- [ ] Define event IDs
- [ ] Define event batching
- [ ] Define event compression

### Event types

- [ ] Session events
- [x] Connection events
- [ ] DOM events
- [ ] Console events
- [ ] Network events
- [ ] Navigation events
- [ ] Interaction events
- [ ] Viewport events
- [ ] Orientation events
- [ ] Device events
- [ ] Performance events
- [ ] Screen/frame events
- [ ] Relay control events

### Event pipeline

```text
Receiver
   ↓
Event stream
   ↓
Relay session
   ├── Live consumers
   └── Remote recorder
```

- [ ] Live event consumption
- [ ] Recording consumption
- [ ] Replay consumption
- [ ] Event fan-out
- [ ] Backpressure strategy

---

# 8. Recording

## LOCAL

- [ ] Explicitly disable persistence
- [ ] Keep event stream in memory
- [ ] Ensure session disappears when Relay stops

## REMOTE

- [ ] Recording creation
- [ ] Recording metadata
- [ ] Event chunking
- [ ] Event compression
- [ ] Asset handling
- [ ] Recording finalisation
- [ ] Recording integrity
- [ ] Recording retention
- [ ] Recording deletion
- [ ] Recording recovery after disconnect

### Storage

- [ ] Decide metadata storage
- [ ] Decide event storage
- [ ] Decide asset storage
- [ ] Decide chunk format
- [ ] Decide indexing
- [ ] Decide retention model
- [ ] Decide deletion model
- [ ] Decide storage limits per subscription tier

---

# 9. Replay

- [ ] Load recording
- [ ] Validate recording
- [ ] Reconstruct timeline
- [ ] Replay DOM
- [ ] Replay console
- [ ] Replay network
- [ ] Replay navigation
- [ ] Replay custom Relay events
- [ ] Replay screen/frame events where available
- [ ] Synchronise multiple event types
- [ ] Timeline scrubbing
- [ ] Play/pause
- [ ] Playback speed
- [ ] Jump to event
- [ ] Event inspection
- [ ] Console filtering
- [ ] Network filtering
- [ ] Error highlighting
- [ ] Session metadata
- [ ] Recording export eventually

---

# 10. Connection & invitation system

## QR

- [x] Generate QR
- [x] Encode session information
- [x] QR expiry
- [x] QR regeneration
- [x] QR invalidation
- [x] QR access policy enforcement

## Short code

- [x] Generate short code
- [ ] Code uniqueness
- [ ] Code expiry
- [ ] Code rate limiting
- [ ] Code invalidation
- [ ] Code access policy enforcement

## Email invite

- [ ] Generate invite
- [ ] Email delivery
- [ ] Invite expiry
- [ ] Invite revocation
- [ ] Invite landing page
- [ ] Display QR
- [ ] Display short code/instructions
- [ ] Display authentication requirement
- [ ] Handle expired invite

---

# 11. Authentication & authorisation

## Identity

- [ ] User accounts
- [ ] Login
- [ ] Logout
- [ ] Session authentication
- [ ] Token/session expiry
- [ ] Device/session authentication

## Session access

- [ ] Open sessions
- [ ] Team-only sessions
- [ ] Authenticated receiver
- [ ] Unauthenticated receiver
- [ ] Invitation authorisation
- [ ] Revocation

## Security

- [ ] Session secrets
- [ ] Short-code entropy
- [x] QR security
- [ ] Replay access control
- [ ] Recording access control
- [ ] Team membership checks
- [ ] Rate limiting
- [ ] Abuse protection
- [ ] Audit events
- [x] Connection limits

---

# 12. Cloud accounts & teams

## Accounts

- [ ] User profile
- [ ] Subscription
- [ ] Entitlements
- [ ] Usage
- [ ] Session history

## Teams

- [ ] Team creation
- [ ] Minimum 3 seats
- [ ] Team members
- [ ] Invitations
- [ ] Roles
- [ ] Membership management
- [ ] Remove member
- [ ] Team-only sessions
- [ ] Team session history

## Roles

We should eventually define:

- [ ] Owner
- [ ] Admin
- [ ] Member
- [ ] Viewer, if useful

---

# 13. Billing

- [ ] Define Solo Developer tier
- [ ] Define Basic tier
- [ ] Define Pro tier
- [ ] Define Teams tier
- [ ] Define minimum Teams purchase
- [ ] Define feature entitlements
- [ ] Define concurrent session limits
- [ ] Define recording limits
- [ ] Define storage limits
- [ ] Define retention limits
- [ ] Define receiver limits
- [ ] Define bandwidth limits
- [ ] Define upgrade flow
- [ ] Define downgrade flow
- [ ] Define cancellation
- [ ] Define failed payment behaviour
- [ ] Define subscription expiry behaviour

And importantly:

> **Never put artificial restrictions on Local to push someone toward Cloud.**

Cloud should sell genuinely valuable cloud functionality.

---

# 14. Cloud Web dashboard

## Session list

- [ ] Active sessions
- [ ] Historical sessions
- [ ] Search
- [ ] Filtering
- [x] Session status
- [ ] Recording status

## Session page

- [ ] Session details
- [x] Connected receivers
- [ ] Live monitoring
- [ ] Console
- [ ] Network
- [ ] DOM/replay
- [ ] Timeline
- [ ] Device information
- [ ] Capabilities
- [ ] Controls
- [ ] Access policy
- [ ] Invites
- [ ] Recording

## Replay page

- [ ] Session summary
- [ ] Timeline
- [ ] Replay
- [ ] Event inspection
- [ ] Console
- [ ] Network
- [ ] DOM
- [ ] Screen/frame view
- [ ] Errors
- [ ] Navigation history

---

# 15. Local Web dashboard

- [ ] Session header
- [ ] Target information
- [ ] LAN connection information
- [x] QR
- [x] Short code
- [ ] Package-manager command
- [x] Connected receivers
- [ ] Live view
- [ ] Console
- [ ] Network
- [ ] DOM
- [ ] Device information
- [ ] Capabilities
- [ ] Controls
- [x] Connection management

No:

- [ ] Cloud account requirement
- [ ] Billing
- [ ] Persistent recording
- [ ] Historical sessions

---

# 16. CLI dashboard

`relay --no-browser`

- [x] Startup UI
- [x] Session status
- [x] Target status
- [x] LAN address
- [x] QR rendering
- [x] Short code
- [ ] Package-manager command
- [x] Connected receivers
- [x] Receiver status
- [ ] Live events
- [ ] Console
- [x] Network
- [ ] Session controls
- [x] Connection controls
- [x] Graceful shutdown
- [x] Keyboard navigation
- [ ] Terminal resize handling
- [ ] Non-interactive fallback
- [ ] Terminal capability detection

---

# 17. Browser experience

The first-time experience is **extremely important**.

Target:

```text
relay 3000
        ↓
browser opens
        ↓
Relay
        ↓
Local / Remote
        ↓
QR
        ↓
scan
        ↓
connected
```

Checklist:

- [ ] Browser auto-launch
- [ ] Cloud reachability detection
- [ ] Local fallback
- [ ] Local/Remote selection
- [ ] Authentication when required
- [ ] Session loading
- [x] QR
- [x] Short code
- [ ] Receiver instructions
- [x] Connection confirmation
- [ ] Clear errors
- [ ] Zero unnecessary setup

---

# 18. Browser agent bootstrap

This deserves its own investigation before implementation.

- [ ] Decide how agent gets into target app
- [ ] Determine CSP compatibility
- [ ] Determine Next.js compatibility
- [ ] Determine Vite compatibility
- [ ] Determine static HTML compatibility
- [ ] Determine SPA compatibility
- [ ] Determine WebSocket compatibility
- [ ] Determine service-worker implications
- [ ] Determine iframe implications
- [ ] Determine cross-origin limitations
- [ ] Determine injection strategy
- [ ] Determine development-mode requirements
- [ ] Determine production-mode requirements

This is one of the **remaining major architectural unknowns**.

---

# 19. Screen capture

We should explicitly separate:

### Browser replay

- [ ] DOM replay
- [ ] interaction replay
- [ ] console/network timeline

from:

### Actual pixels

- [ ] Determine which receiver types can provide screenshots
- [ ] Determine which can provide video
- [ ] Determine permission requirements
- [ ] Determine capture frequency
- [ ] Determine encoding
- [ ] Determine bandwidth
- [ ] Determine storage
- [ ] Determine replay synchronisation

And:

- [ ] Never claim silent physical-screen capture where the platform doesn't permit it

---

# 20. Error handling

Every layer needs explicit failure states.

- [ ] Target unavailable
- [ ] Target crashes
- [ ] Relay crashes
- [ ] Network disappears
- [ ] Receiver disconnects
- [ ] Cloud edge disconnects
- [ ] Authentication expires
- [ ] Session expires
- [x] QR expires
- [x] Short code expires
- [ ] Recording fails
- [ ] Storage unavailable
- [ ] Replay corrupt
- [ ] Unsupported capability
- [ ] Unsupported receiver
- [ ] Protocol mismatch
- [ ] Version mismatch

And every failure should produce a **useful user-facing explanation**, not an opaque socket error.

---

# 21. Observability of Relay itself

Relay needs observability separate from observing the receiver.

- [ ] Relay logs
- [ ] Structured logging
- [ ] Cloud API logs
- [ ] Edge logs
- [ ] Session metrics
- [x] Connection metrics
- [ ] Event throughput
- [ ] Tunnel throughput
- [ ] Recording throughput
- [ ] Error rates
- [ ] Cloud resource usage
- [ ] Alerting
- [ ] Health checks

---

# 22. Performance

### Local

- [ ] Startup speed
- [x] QR generation speed
- [ ] LAN connection latency
- [ ] Event latency
- [ ] Tunnel latency
- [ ] Multiple receivers
- [ ] Large payloads

### Remote

- [x] Connection latency
- [ ] Tunnel latency
- [ ] Event latency
- [ ] Multiplexing efficiency
- [ ] Recording throughput
- [ ] Replay loading
- [ ] Concurrent sessions
- [ ] Cloud edge scaling

### Receiver

- [ ] CPU impact
- [ ] Memory impact
- [ ] Battery impact
- [ ] Network usage
- [ ] DOM recording overhead

---

# 23. Testing strategy

## Unit tests

- [ ] Session state machine
- [x] Connection state machine
- [ ] Protocol validation
- [ ] Access policy
- [ ] Capability negotiation
- [ ] Event ordering
- [ ] Recording
- [ ] Replay
- [x] Invitation generation
- [x] Short codes
- [ ] Entitlements

## Integration tests

- [ ] Local host → browser
- [x] Local host → mobile browser
- [ ] Local host → CLI
- [ ] Remote host → browser
- [ ] Remote host → mobile browser
- [ ] Multiple receivers
- [ ] Disconnect/reconnect
- [ ] Recording/replay
- [ ] Team-only access
- [ ] Open access
- [ ] Expired invitations

## End-to-end

- [ ] `relay 3000`
- [ ] Browser opens
- [x] QR displayed
- [ ] Phone scans
- [ ] Receiver connects
- [ ] Target loads
- [ ] Events appear
- [ ] Controls work
- [x] Connection disconnects
- [ ] Remote recording persists
- [ ] Replay works

## Network failure testing

- [ ] Wi-Fi disconnect
- [ ] Internet disconnect
- [ ] Cloud edge restart
- [ ] Relay restart
- [ ] Receiver restart
- [ ] Network change
- [ ] Slow network
- [ ] High latency
- [ ] Packet loss

---

# 24. Security testing

- [ ] Session ID enumeration resistance
- [ ] Short-code brute-force resistance
- [x] QR replay resistance
- [ ] Invite replay resistance
- [ ] Authentication bypass testing
- [ ] Team access bypass testing
- [ ] Recording access testing
- [ ] Cross-session isolation
- [ ] Receiver isolation
- [ ] Tunnel isolation
- [ ] SSRF protection
- [ ] Host targeting protection
- [ ] Cloud edge isolation
- [ ] Rate limiting
- [ ] Abuse detection
- [ ] Data deletion
- [ ] Secret handling
- [ ] Dependency auditing

---

# 25. Developer experience

The actual CLI needs to feel excellent.

- [x] `relay <port>`
- [x] `relay <port> --no-browser`
- [x] Useful help
- [x] Useful errors
- [x] Sensible defaults
- [x] Fast startup
- [ ] Package-manager instructions
- [ ] npm support
- [ ] pnpm support
- [x] bun support
- [ ] yarn support if appropriate
- [ ] Windows support
- [ ] macOS support
- [x] Linux support
- [ ] WSL considerations
- [ ] Node compatibility
- [x] Bun compatibility if supported
- [ ] CLI update mechanism

---

# 26. Documentation

## Getting started

- [ ] Install
- [ ] Run first Relay
- [x] Connect phone
- [ ] Local workflow
- [ ] Remote workflow

## Receiver documentation

- [ ] Browser
- [ ] Mobile browser
- [ ] Android
- [ ] iOS
- [ ] CLI

## Concepts

- [ ] Sessions
- [x] Connections
- [ ] Receivers
- [ ] Capabilities
- [ ] Local vs Remote
- [ ] Invitations
- [ ] Access policies
- [ ] Recordings
- [ ] Replay

## Troubleshooting

- [ ] Can't connect
- [x] QR doesn't work
- [ ] LAN unavailable
- [ ] Remote unavailable
- [ ] Authentication failure
- [ ] Recording failure
- [ ] Browser compatibility

---

# 27. Cloud operations

- [ ] Production infrastructure
- [ ] Cloud API deployment
- [ ] Cloud edge deployment
- [ ] Database
- [ ] Object storage
- [ ] CDN where appropriate
- [ ] TLS
- [ ] DNS
- [ ] Secrets
- [ ] Backups
- [ ] Database migrations
- [ ] Storage lifecycle
- [ ] Monitoring
- [ ] Alerting
- [ ] Incident handling
- [ ] Capacity planning
- [ ] Horizontal scaling
- [ ] Edge scaling

---

# 28. Billing & commercial launch

- [ ] Finalise tiers
- [ ] Finalise pricing
- [ ] Finalise limits
- [ ] Stripe integration
- [ ] Subscription lifecycle
- [ ] Entitlements
- [ ] Teams billing
- [ ] 3-seat minimum
- [ ] Customer portal
- [ ] Invoice handling
- [ ] Failed payment handling
- [ ] Cancellation
- [ ] Refund handling
- [ ] Terms
- [ ] Privacy policy
- [ ] Data retention policy

---

# 29. Release engineering

- [ ] Package builds
- [ ] CLI packaging
- [ ] CLI publishing
- [ ] Versioning
- [ ] Changelog
- [ ] GitHub releases
- [ ] CI
- [ ] Tests on PR
- [ ] Lint
- [ ] Typecheck
- [ ] Build
- [ ] Security scanning
- [ ] Cloud deployment
- [ ] Database migrations
- [ ] Rollback
- [ ] Canary/staged deployment if needed

---

# 30. Launch readiness

### Local

- [ ] `relay 3000` works from clean machine
- [x] QR works
- [x] Mobile browser works
- [ ] Desktop browser works
- [x] CLI works
- [ ] Multiple receivers work
- [ ] Offline workflow works
- [x] No account required
- [x] No USB required

### Remote

- [ ] Account creation works
- [ ] Remote session works
- [ ] Remote receiver works
- [ ] Recording works
- [ ] Replay works
- [ ] Open sessions work
- [ ] Team-only sessions work
- [ ] Invites work
- [x] Short codes work
- [ ] Email invites work
- [ ] Subscription enforcement works

### Production

- [ ] Monitoring
- [ ] Alerting
- [ ] Backups
- [ ] Recovery
- [ ] Security review
- [ ] Load testing
- [ ] Documentation
- [ ] Billing
- [ ] Legal pages
- [ ] Support process

---

# The actual development order

I **wouldn't** tackle that checklist top-to-bottom.

I'd develop Relay in these broad stages:

```text
PHASE 1
Architecture + protocol
        ↓
PHASE 2
Local Relay
        ↓
PHASE 3
Browser receiver
        ↓
PHASE 4
Live session/event system
        ↓
PHASE 5
Tunnel
        ↓
PHASE 6
CLI + Local dashboard
        ↓
PHASE 7
Remote cloud transport
        ↓
PHASE 8
Remote recording
        ↓
PHASE 9
Replay
        ↓
PHASE 10
Access control + invites
        ↓
PHASE 11
Android/iOS receivers
        ↓
PHASE 12
Accounts + subscriptions
        ↓
PHASE 13
Teams
        ↓
PHASE 14
Hardening + scale
        ↓
PHASE 15
Launch
```

But there's an even more useful way I'd break it down for Jira:

## The Relay epic map

```text
RELAY-FOUNDATION
├── Architecture
├── Domain model
├── Protocol
└── Package structure

RELAY-LOCAL
├── CLI
├── Local transport
├── Local dashboard
└── Local session management

RELAY-RECEIVER
├── Browser agent
├── Receiver protocol
├── Capabilities
└── Mobile browser

RELAY-TUNNEL
├── HTTP
├── WebSocket
├── Multiplexing
└── Connection reliability

RELAY-OBSERVABILITY
├── Event stream
├── DOM
├── Console
├── Network
├── Navigation
├── Interaction
└── Device events

RELAY-CLOUD
├── Cloud API
├── Cloud edge
├── Remote transport
├── Session routing
└── Authentication

RELAY-RECORDING
├── Recording
├── Storage
├── Retention
└── Replay

RELAY-INVITES
├── QR
├── Short codes
├── Email invites
└── Access policies

RELAY-MOBILE
├── Android
└── iOS

RELAY-PLATFORM
├── Accounts
├── Billing
├── Subscriptions
└── Teams

RELAY-PRODUCTION
├── Infrastructure
├── Security
├── Performance
├── Observability
└── Launch
```

### And one important rule for the project

I would **not** create Jira tickets for every checkbox yet.

This checklist is our **master architecture/product inventory**.

Next, we should take **Phase 1 — Foundation** and turn only that into the actual Jira hierarchy:

**Epic → capabilities → stories → acceptance criteria → dependencies.**

That lets us keep the architecture locked while still discovering things naturally during the spikes, rather than prematurely creating 200+ implementation tickets.