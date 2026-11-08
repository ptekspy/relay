# Relay Product Vision & Specification

## 1. Product Definition

Relay is a **development tool for temporarily making services running on a developer’s machine accessible elsewhere, locally or remotely, without requiring any changes to the application being relayed**.

Relay is designed around two promises:

> **Share any local service easily. Understand every connection.**

Relay is not limited to websites, mobile testing, debugging, tunnelling, APIs, or demos.

Those are use cases built on top of the same primitive:

> **If it is exposed on a port, Relay can relay it.**

Relay may relay:

- websites
- APIs
- WebSocket servers
- SSE endpoints
- webhook receivers
- databases
- game servers
- SSH
- arbitrary TCP services
- anything else accessible from the host machine through a port

Relay must remain external to the application.

There is:

- no Relay SDK required
- no middleware required
- no application code changes
- no framework-specific integration required
- no requirement for the relayed application to know Relay exists

Framework-specific or protocol-specific behaviour may be detected automatically, but Relay must never require cooperation from the application.

---

# 2. Product Laws

These rules should be treated as architectural and product constraints.

## 2.1 Relay is external

Relay can observe, proxy, inspect and control traffic and capable consumers, but it is never inserted into the application.

A Next.js application, NestJS API, Django server or arbitrary TCP service must work through Relay without being modified.

---

## 2.2 Anything on a port can be relayed

Relay should not artificially restrict the developer based on service type or conventional port usage.

If the developer runs:

```bash
relay 5432
```

Relay relays port `5432`.

Relay does not block or warn merely because the port is commonly associated with PostgreSQL or another sensitive service.

The developer explicitly chose to expose it.

---

## 2.3 Local is free and requires no account

Anything using Relay purely locally must remain usable without:

- registration
- authentication
- payment
- a Relay account

Relay must also function when the host has no internet connection.

---

## 2.4 Remote requires an account and subscription

Remote Relay functionality requires:

- Relay account
- authentication
- an active subscription permitting Remote usage

Remote availability is checked during session setup.

If Remote is unavailable to the user, Relay should present the relevant upgrade path.

---

## 2.5 Premium Local capabilities are allowed

The Local transport itself remains free.

However, premium capabilities may still require a subscription even when used with a Local session.

Examples include:

- Relay Replay
- persisted comments
- advanced collaboration
- stored session history
- cross-session search

This means:

> Local transport is free.

It does not mean every capability operating around a Local session must be free.

---

# 3. Core Concepts

## 3.1 Relay Session

A Relay Session is the host-side container for one running Relay invocation.

A session may contain:

- one or more services
- one or more ports
- one or more consumer connections
- session metadata
- Replay data
- comments
- markers
- observers
- audit history

A Relay Session has a stable identity for its entire lifetime.

Temporary failure of:

- a local service
- internet connectivity
- a consumer connection

must not create a new Relay Session.

---

## 3.2 Service

A Service is a named Relay configuration representing one or more ports.

Example:

```json
{
  "services": {
    "frontend": {
      "ports": [2000, 3000]
    },
    "api": {
      "ports": [4000]
    }
  }
}
```

Relay should preserve service identity rather than flattening everything into anonymous ports.

The UI may therefore represent:

```text
frontend:[2000,3000]
api:4000
```

A Service may contain:

- name
- ports
- default port
- dependencies
- description
- icon or emoji
- protocol hints
- tags
- mode
- Replay settings
- storage settings
- access-control settings
- reusable alias configuration
- other wizard-configurable Relay settings

At least one port is required.

Relay does not support policy-only services with no underlying port.

---

## 3.3 Service Dependencies

A service may depend on another service.

Example:

```text
frontend -> api -> auth
```

Running:

```bash
relay frontend
```

causes Relay to include the ports from:

- frontend
- api
- auth

Dependencies are transitive.

Dependencies effectively compose service port sets.

Circular relationships are not inherently invalid.

For example:

```text
frontend -> api
api -> auth
auth -> frontend
```

still resolves to the unique set of included services and ports.

Relay simply tracks visited services and avoids infinite traversal.

A dependency contributes its service identity and ports to the Relay Session.

The invoked root service's policy does not automatically get replaced by a dependency's policy.

---

## 3.4 Connection

A Connection is one independent consumer of a Relay Session.

Examples:

- Safari on an iPhone
- Chrome on a laptop
- Relay Android application
- another developer's CLI
- Postman
- curl
- another service consuming a relayed API

Connections are independent.

Multiple consumers may connect to the same Relay Session simultaneously without sharing application state unless the underlying service itself causes them to.

Each Connection performs capability detection.

Capabilities may differ by:

- platform
- browser
- native application
- CLI
- protocol
- device
- operating system

Relay should never assume that all consumers provide the same diagnostics or control capabilities.

---

## 3.5 Host

The Host is the machine and user running the Relay Session.

The Host owns the Relay Session.

The Host can observe and control supported consumer Connections according to the capabilities each Connection exposes.

---

## 3.6 Observer

An Observer is an authenticated host-side participant viewing the Relay Session.

Observers are primarily a Teams capability.

Observers:

- can inspect Relay control data
- can inspect Relay Replay
- can participate in collaboration
- can request control of Connections

Observers are not consumers.

Observers do not count toward the organisation's host allowance simply by observing.

Observers must authenticate because they have access to sensitive control and diagnostic data and their actions need to be auditable.

---

# 4. Starting Relay

## 4.1 Basic invocation

```bash
relay 3000
```

starts Relay for port `3000`.

Relay determines whether the machine can reach Relay Cloud.

### If offline

Relay launches the bundled Local-only Relay interface from the host machine.

Only Local mode is available.

No account is required.

### If online

Relay launches the hosted Relay web application.

The user may choose:

- Local
- Remote, if available

---

# 5. Session Setup Wizard

The browser setup flow should guide the Host through the available session configuration.

At minimum:

1. Select Local or Remote.
2. If Remote:
   - authenticate if required
   - verify subscription
   - show upgrade path if necessary
3. Confirm the Relay Session.
4. Configure relevant settings.
5. Approve the session.
6. Display Connection options.

Local skips Remote authentication/subscription requirements.

---

# 6. Connection Screen

After approval, Relay presents ways for consumers to connect.

These include:

## QR

Used by:

- mobile browser
- Relay Android application

## Share Code

Used from the Relay browser experience.

## CLI

Relay provides a copyable CLI command.

The UI should allow package-manager variations such as:

- npm
- pnpm
- bun
- other supported package runners

Team accounts may additionally choose to restrict the Relay Session to team members.

---

# 7. `--no-browser`

Running Relay with:

```bash
relay 3000 --no-browser
```

must preserve the same functionality as the browser flow.

The experience is rendered through an Ink-based interactive CLI.

It should not degrade into a low-quality sequence of primitive command flags.

Relay should treat Ink as a real application interface.

---

# 8. Host Selection

Relay should support:

```bash
relay 3000 --host 192.168.1.50
```

This allows Relay to target a service reachable from a specific local IP instead of assuming localhost.

The conceptual rule is:

> Relay relays a service reachable from the Host machine.

It is not limited strictly to `localhost`.

---

# 9. Multiple Ports

Relay supports multiple ports in a single Session.

Example:

```bash
relay 3000 4000 5000
```

This creates one Relay Session containing all three services/ports.

Use cases include:

- frontend
- API
- WebSocket server
- admin panel
- documentation server
- supporting local services

A multi-port Relay Session should be treated as one logical shareable development environment.

---

# 10. Named Service Invocation

Relay may start named services from project configuration.

Examples:

```bash
relay frontend
relay api
relay full-stack
```

Relay also supports multiple named services:

```bash
relay frontend api admin
```

And mixed named services and raw ports:

```bash
relay frontend 5000
```

Relay resolves:

- services
- dependencies
- ports
- duplicates
- session-level policy

into a single Relay Session.

---

# 11. Session-Level Policy Resolution

Some configuration values apply to the entire Relay Session.

When multiple selected services provide conflicting values, Relay resolves them toward the more capable, persistent or restrictive behaviour.

Examples:

## Mode

Remote wins over Local.

If:

```text
frontend = Local
api = Remote
admin = Local
```

then:

```bash
relay frontend api admin
```

creates one Remote Relay Session.

---

## Replay

If any selected service enables Replay:

```text
replay: true
```

Replay is enabled for the entire Session.

---

## Replay Storage

Cloud storage wins over Local storage when configurations are combined.

An explicit CLI override may still choose Local storage where permitted.

---

## Access Control

Team-only access wins over public access.

If any selected root configuration requires team-only access, the entire Relay Session is team-only.

---

## CLI Overrides

Explicit CLI options override configuration-derived values.

Conceptually:

```text
CLI flags > resolved service configuration > Relay defaults
```

---

# 12. Project Configuration

Relay automatically detects:

```text
relay.config.json
```

from the directory where the Relay command is run.

The configuration file may contain anything that can be configured through the Relay wizard.

This includes:

- ports
- named services
- dependencies
- mode
- Replay
- Replay storage
- team access
- session metadata
- aliases
- default ports
- other Relay options

A fully configured project should allow:

```bash
relay
```

to immediately start the configured workflow and open directly to the Connection screen when no further input is needed.

---

# 13. `relay create-service`

Relay uses a guided Ink flow for service creation.

```bash
relay create-service
```

launches a proper interactive wizard.

One Service is created per wizard run.

The wizard may configure:

- service name
- one or more ports
- dependencies
- default port
- mode
- Replay
- Replay storage
- access control
- metadata
- reusable alias
- other supported service configuration

The wizard writes or updates `relay.config.json`.

Relay should prefer a good interactive CLI experience over forcing developers to remember configuration-editing commands.

---

# 14. Default Port

A named Service containing multiple ports may define a default port.

Example:

```json
{
  "services": {
    "frontend": {
      "ports": [2000, 3000],
      "defaultPort": 3000
    }
  }
}
```

A consumer connecting to the `frontend` Service still receives access to both ports.

Visual clients use port `3000` as the initial/default destination.

---

# 15. Service Sharing Identity

A Relay Session receives an ephemeral share code.

For a multi-service Session:

```text
ABC123
```

represents the entire Relay Session.

Consumers may target the whole Session:

```text
ABC123
```

a named service:

```text
ABC123-frontend
ABC123-api
```

or a specific port:

```text
ABC123-3000
ABC123-4000
```

The whole-session code exposes all ports/services included in the Session.

The Host controls exposure by choosing which services and ports are included when Relay starts.

Relay should not add unnecessary per-port privacy configuration.

If the Host does not want a port shared, they should not include it in the Relay Session.

---

# 16. Consumer Behaviour

A consumer should use the relayed service as intended.

Relay must not replace the service with a proprietary consumer interface.

Examples:

- a website consumer browses the website
- an API client consumes the API
- a database client talks to the database
- an SSH client talks SSH

Relay surrounds the Connection with transport, diagnostics and optional control capabilities.

It does not redefine the service experience.

---

# 17. Capability Detection

Each consumer Connection advertises or exposes capabilities.

Possible capabilities include:

- current route
- screenshots
- live screen
- DOM snapshots
- console logs
- network traffic
- navigation control
- reload
- DOM interaction
- native screen click/tap
- device metadata
- other platform-specific capabilities

Relay should treat capabilities dynamically.

The Host interface only exposes controls and diagnostics supported by that specific Connection.

---

# 18. Host Dashboard

The Relay Session dashboard presents each consumer Connection as a minimal card.

A card should provide enough information to understand:

- what is connected
- which service it is using
- current state
- key capability indicators
- important errors/state

The Host may open a Connection detail view for deeper inspection and control.

Relay should avoid flooding the top-level Session view with every available diagnostic.

---

# 19. Website Connection Detail

For a capable website Connection, the ideal detailed view includes:

- live screen or visual snapshots
- console logs
- network activity
- DOM snapshot
- current route

The Host may also control the consumer where the Connection permits it.

Examples:

- navigate to another route
- reload
- manipulate supported DOM interactions
- interact with a native Relay Android consumer through screen controls

Relay is the intermediary and may technically observe far more than is surfaced in the UI.

The UI should expose what is useful rather than everything merely because it exists.

---

# 20. Relay as Middleman

Relay sits between the Host service and its consumers.

Therefore Relay may observe:

- requests
- responses
- connection state
- timing
- transport errors
- protocol activity
- other intermediary information

The principle is:

> Relay sees everything it is technically in the path of.

What Relay chooses to display to the developer is a separate UX/product decision.

---

# 21. Local Service Availability

A configured Service does not have to be available when Relay starts.

Example:

```json
{
  "ports": [3000, 4000]
}
```

If `3000` is listening but `4000` is not:

Relay still starts.

Port `4000` is marked unavailable.

Relay continues retrying indefinitely.

Relay should periodically report that it is still waiting for the service.

When the service becomes available:

> connected

If a previously connected local service disappears mid-session:

- Relay Session remains alive
- the service becomes disconnected
- Relay retries indefinitely
- the same share identity remains active
- the service reconnects when available

This behaviour supports normal development flows where local servers constantly restart.

---

# 22. Remote Host Connectivity Loss

If a Remote Host loses internet:

- the Relay Session remains conceptually alive
- Relay retries the cloud connection
- the Host continues buffering locally where possible
- Replay data continues to be captured locally where possible
- missing Replay data syncs after reconnection
- remote consumers see a reconnecting/unavailable state
- the existing share identity remains stable

Relay should not create a new Session merely because the Host temporarily lost internet.

---

# 23. Graceful Session Shutdown

When the Host intentionally ends Relay:

Relay sends a shutdown message to consumers before terminating connections.

Consumers should know that the Session ended intentionally rather than interpreting it as a broken connection.

Supported visual consumers then land on a Relay end screen.

The screen may show:

- that the Relay Session ended
- what they were connected to
- session duration
- minimal Relay marketing/product information

CLI/non-visual consumers receive an explicit termination reason.

If Replay is enabled, the Replay timeline ends at that point.

---

# 24. Pause and Resume

Relay supports pausing a Session.

Pause means:

> Keep the Relay Session alive while temporarily stopping normal service access.

Use cases include:

- rebuilding packages
- restarting the dev environment
- making disruptive local changes
- temporarily stopping a server

While paused:

- share code remains reserved
- aliases remain bound
- Session identity remains unchanged
- consumers receive an intentional paused state
- Replay records the pause interval
- the Host may resume the same Session later

Without a persistent daemon, pause/resume actions live inside the active Relay process/interface.

A future daemon may support external pause/resume commands.

---

# 25. Relay Replay

Relay Replay is a premium capability.

Replay may be enabled for:

- Local Sessions
- Remote Sessions

Replay requires a paid subscription even when recording is stored locally.

The Local transport remains free; Replay is a separate premium capability.

---

# 26. Replay Mental Model

Relay Replay behaves like **TiVo for a development Session**.

While a Session is live:

```text
Session Start ------------------------------ Live
```

The right edge represents the current live state.

The Host may scrub backward without affecting the real consumer Connection.

The consumer continues using the service normally.

Relay continues recording.

The Host is simply viewing an earlier point in history.

Selecting Live returns the Host to the current state.

When the Session ends, the timeline stops growing.

The resulting final timeline is the Replay.

---

# 27. Replay Fidelity

Replay captures every useful signal Relay observed and was able to record.

For a capable website Connection this includes:

- live screen / visual capture
- screenshots
- DOM state
- events
- interactions
- console logs
- network activity
- route changes
- comments
- Connection metadata
- capability changes
- service events
- timing information

When the Host scrubs to a timestamp, all diagnostic panels move to the same point in time.

Replay is not simply a video.

It is synchronized historical state across all captured signals.

---

# 28. Connection Timeline

Each consumer Connection has its own Replay timeline.

The Host may inspect everything that happened to that consumer independently.

---

# 29. Session Timeline

A Relay Session also has a top-level timeline.

The Session timeline synchronizes activity across:

- multiple Connections
- multiple devices
- multiple services

This supports cross-device and cross-service debugging.

Example:

A notification broadcast could show:

1. API request triggered
2. backend service event
3. network activity
4. multiple devices receiving the update
5. route/UI changes
6. logs/errors
7. screenshots
8. tester comments

all aligned on one common timeline.

---

# 30. Automatic Replay Markers

Relay should create significant timeline markers automatically.

Examples:

- service disconnected
- service reconnected
- consumer joined
- consumer left
- route changed
- uncaught error
- HTTP 500
- Session paused
- Session resumed
- controller changed
- comment added

Markers should be filterable so the timeline remains usable.

---

# 31. Manual Replay Markers

The Host may manually create timestamped Replay markers.

Example:

> Triggering notification broadcast

Markers make important test moments easy to find later.

---

# 32. Host Replay Notes

The Host may add text-only notes.

Notes may attach to:

- Session + timestamp
- Connection + timestamp
- Service + timestamp

Relay already captures the surrounding technical context, so notes do not need file attachments.

---

# 33. Consumer Comments

Comments are premium.

A consumer may leave a text comment for the Host.

For visual consumers:

1. consumer clicks a position
2. enters a comment
3. a comment thread appears at that visual position
4. Host sees the comment live
5. Replay preserves that comment at the exact Session moment

Comments must not rely on DOM anchoring.

DOM structure may change during debugging, causing DOM-bound threads to disappear or move incorrectly.

Instead a visual comment stores context such as:

- Connection
- timestamp
- route
- captured visual frame
- visual coordinates
- surrounding Relay diagnostics

The thread belongs to the recorded moment, not to the current DOM.

For CLI consumers, comments can be sent through the CLI.

---

# 34. Replay Storage

Default:

> Relay Replay is stored in Relay Cloud.

Paid subscribers may choose Local storage instead through an option such as:

```bash
--local-storage
```

The exact final flag name is not yet fixed.

This gives developers a privacy/control option while keeping Cloud Replay as the default experience.

---

# 35. Replay Export

Replay may be exported as a normal `.zip`.

Relay should not invent a proprietary binary `.relay` format.

The export contains transparent files such as:

```text
session.json

connections/
  iphone/
    timeline.json
    console.json
    network.json
    routes.json
    events.json
    screenshots/

services/
  frontend/
  api/

comments.json
markers.json
metadata.json
```

HAR or other standard formats should be used where appropriate.

The exact folder structure remains implementation-defined.

The principle is:

> Developers should be able to inspect their own exported data without Relay.

---

# 36. Replay Import

Relay may import a Replay `.zip`.

Imported sessions open in a read-only Replay mode.

Import does not:

- restart the original Session
- reconnect consumers
- recreate a live Host
- allow control actions

Imported Replay is for historical inspection only.

Proper rendering requires Relay.

Relay does not need to embed a standalone browser player inside the export.

---

# 37. Replay Search

Relay supports search within Replay data.

Searchable information includes:

- logs
- network traffic
- routes
- comments
- Host notes
- Service names
- Connection metadata
- Session metadata

Search should support:

- current Replay
- cross-session stored Replay search

Example:

> Find every Session where `/checkout` returned HTTP 500.

Initial implementation may use literal and structured search.

Semantic search is post-release.

---

# 38. AI Analysis

AI-assisted Relay Session analysis is post-release.

Eventually Relay may answer questions such as:

> Why did checkout fail for this consumer?

using synchronized evidence from:

- network
- console
- routes
- DOM
- services
- comments
- Replay timeline

AI analysis should link findings back to exact Replay moments and supporting evidence.

It is not required for the initial release.

---

# 39. Teams

Teams extends Relay into collaborative development infrastructure.

Teams may include:

- team-only Sessions
- shared live Sessions
- shared Replay
- shared comments
- shared Session history
- shared search
- organisation billing
- administration
- role/permission management
- authenticated observers
- control handoff
- immutable audit log

---

# 40. Connection Control in Teams

Multiple teammates may observe the same Relay Session.

Control ownership is per Connection.

Only one person may control a given Connection at one time.

Example:

- Paddy controls Android device A
- Derek controls browser B
- Sally observes browser C

Another teammate may request control of a Connection.

The current controller may grant it.

The original Host retains ultimate authority and may reclaim control at any time.

Multiple Connections may therefore have different controllers simultaneously.

---

# 41. Authentication and Consumer Identity

Public consumers do not require Relay identity.

If a Relay Session is explicitly public, Relay does not require consumers to authenticate merely for identification.

Authentication becomes mandatory when the Host enables access controls that require it.

Example:

- team-only Session

Relay may also provide an optional consumer feature:

> Share my Relay identity with the Host

This may make comments and collaboration more useful without forcing identity into normal public Sessions.

---

# 42. Audit Log

Paid/Team Relay should maintain an audit trail.

Examples:

- observer joined
- control requested
- control granted
- control reclaimed
- Session paused
- Session resumed
- alias takeover
- comment added
- marker added
- Replay exported
- Session settings changed

Audit events are immutable.

Individual audit entries cannot be edited or deleted.

Audit retention/deletion follows whole-Session/account retention policies.

Conceptually:

> Replay tells you what happened in the relayed system.

> Audit tells you what people did inside Relay.

---

# 43. Reusable Aliases

Normal Relay Sessions receive ephemeral share codes.

The share code expires when the Session ends.

Paid tiers may receive reusable aliases.

Provisional model:

- Basic paid: none
- Pro: approximately 3
- Team: approximately 20

Exact limits remain subject to pricing decisions.

Aliases may target:

- an entire Relay Session
- a named Service inside a Relay Session

Examples:

```text
paddy-checkout
paddy-api-demo
team-mobile-qa
```

Aliases do not automatically bind to Sessions based on matching names.

Binding is explicit.

An alias may be selected through:

- Relay wizard
- project configuration
- interactive startup flow

---

# 44. Alias Exclusivity

A reusable alias may point to only one active target.

If another Session tries to claim an active alias:

- Relay rejects the claim

If the takeover request originates from the same machine:

- Relay may offer a Take Over Alias action
- the user must re-authenticate through the browser
- successful authentication rebinds the alias
- the previous Session continues under its ephemeral identity but loses the alias

Aliases are subscription features, so users already have Relay accounts.

---

# 45. Future Persistent Daemon

Relay's initial architecture does not require a persistent background daemon.

However, a future Relay daemon is desirable.

Potential capabilities:

- Session survives terminal closure
- add ports dynamically
- remove ports dynamically
- reconnect CLI/UI to running Sessions
- manage several Sessions
- external pause/resume commands
- richer local Session lifecycle management

Example future commands:

```bash
relay add 5000
relay remove 4000
```

This is explicitly future scope and should not block the initial Relay architecture.

---

# 46. Launch Scope

Relay should not be reduced to a tiny tunnelling MVP that contradicts the intended product.

The initial product should support the product model defined above.

That includes the foundational shape:

## Core relay

- Local mode
- Remote mode
- offline Local operation
- arbitrary port relay
- multiple ports
- named Services
- Service dependencies
- Local service reconnect behaviour
- Remote Host reconnect behaviour
- stable Session identity

## UX

- browser wizard
- Ink `--no-browser` experience
- QR
- share code
- CLI Connection
- project config
- `relay create-service`
- minimal Connection dashboard
- detailed Connection view

## Diagnostics

Where supported by the Connection:

- live screen/snapshots
- console
- network
- DOM snapshot
- current route
- Host control

## Replay

- live scrubber
- synchronized signal history
- Session timeline
- Connection timelines
- automatic markers
- manual markers
- Host notes
- consumer comments
- Cloud storage
- optional Local storage
- export
- read-only import

## Teams

- authenticated observers
- team access locking
- Connection-level controller ownership
- control requests
- Host reclaim
- audit trail

## Paid convenience

- reusable aliases
- premium Replay
- persisted comments
- stored history/search

---

# 47. Post-Release Scope

These are valuable but should not block the first complete Relay release.

## Semantic Replay search

Example:

> Find Sessions where users were unable to complete checkout.

---

## AI Session analysis

Example:

> Why did this Connection fail?

---

## Persistent background daemon

Dynamic port/session management independent of the original terminal process.

---

## Advanced historical intelligence

Potential future capabilities may include:

- recurring failure detection
- cross-session comparison
- automatic issue clustering
- regression detection
- test-session analysis

These remain future capabilities rather than launch requirements.

---

# 48. Commercial Model

The definitive pricing table is still TBD.

Known product rules:

## Free

Local Relay transport.

No account required.

---

## Paid

Required for:

- Remote Relay
- Relay Replay
- persisted comments
- Replay Cloud storage
- advanced collaboration
- stored historical tooling

---

## Pro

May include:

- reusable aliases
- expanded Replay/search/history limits
- additional premium capabilities

Current conceptual alias allowance:

```text
3
```

---

## Teams

Includes collaborative Relay functionality such as:

- team-only access
- authenticated observers
- control handoff
- shared Replay
- shared Session history
- audit logs
- team administration
- more reusable aliases

Current conceptual alias allowance:

```text
~20
```

Exact limits, storage allowances and Replay retention remain TBD.

---

# 49. Replay Retention

Relay Cloud Replay retention is currently **TBD**.

Potential models include:

- time-based retention
- storage quotas
- tier-based combinations

This should remain unresolved until pricing/storage economics are modelled properly.

---

# 50. The Relay Mental Model

The simplest conceptual model is:

```text
                     Relay Session
                           |
        -----------------------------------------
        |                  |                    |
     Service            Service              Service
    frontend              api                  ws
  [2000,3000]            4000                 5000
        |                  |                    |
        -----------------------------------------
                           |
                        Relay
                           |
         -----------------------------------
         |                |                |
     Connection       Connection       Connection
      iPhone           Android            CLI
         |                |                |
    capabilities      capabilities      capabilities
```

Around those Connections Relay provides:

```text
Live inspection
Control
Replay
Comments
Markers
Collaboration
Search
Audit
```

The relayed application remains completely unaware that Relay exists.

---

# 51. Product Position

Relay should not primarily position itself as:

- another tunnel
- mobile browser testing
- remote DevTools
- API inspection
- screen sharing
- debugging software

Those are all incomplete descriptions.

The broader product is:

> **Relay is a development tool that makes local services easy to share and gives developers deep visibility into every connection.**

A useful competitive framing is:

> **Other tools expose the port. Relay helps you understand and manage what happens after you expose it.**

And the core product promise remains:

# Share any local service easily. Understand every connection.