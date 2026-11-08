# Relay Use-Case Catalogue — First Canonical Cut

The cleanest approach is to separate:

1. **Core use cases** — what an actor is trying to achieve.
2. **Service scenarios** — the kind of service being relayed.
3. **Capabilities** — what Relay uses to support the outcome.

For example:

- **Use case:** Diagnose why checkout failed on a tester’s phone.
- **Service scenario:** Website plus API.
- **Capabilities:** Network history, console logs, screenshots, Replay and comments.

“Console logs,” “Remote mode” and “Replay” are not themselves complete use cases. Relay’s fundamental use case is making a service reachable and then helping the Host understand and manage each resulting Connection. :chatgpt-content-reference{index="0"}

## Actors

| Actor | Meaning |
|---|---|
| **Host** | The developer running and owning the Relay Session. |
| **Consumer** | A person, device, application or process using a relayed Service. |
| **Observer** | An authenticated teammate inspecting or collaborating on a Session from the Host side. |
| **Team administrator** | A person managing team access, roles, billing or organisation settings. |
| **External service** | A third-party system connecting to Relay, such as a webhook provider. |

These actors follow the Session, Service, Connection, Host and Observer model already established in the specification. :chatgpt-content-reference{index="1"} :chatgpt-content-reference{index="2"} :chatgpt-content-reference{index="3"}

---

## 1. Starting and configuring Relay

Relay supports raw ports, named Services, dependencies, project configuration, browser and Ink setup, and services running somewhere reachable from the Host machine. :chatgpt-content-reference{index="4"} :chatgpt-content-reference{index="5"}

| ID | Use case | Primary actor | Outcome |
|---|---|---|---|
| `relay-use-case-start-single-port` | Start Relay for one port | Host | One local Service becomes available through a Relay Session. |
| `relay-use-case-start-multiple-ports` | Start Relay for several ports | Host | Several related ports are shared as one logical environment. |
| `relay-use-case-start-named-service` | Start a configured named Service | Host | The Host starts a reusable Service without remembering its ports and settings. |
| `relay-use-case-start-multiple-services` | Start several named Services together | Host | Several Services are composed into one Session. |
| `relay-use-case-resolve-service-dependencies` | Start a Service and automatically include its dependencies | Host | Required supporting Services and ports are included transitively. |
| `relay-use-case-mix-services-and-ports` | Start named Services alongside ad-hoc ports | Host | Configured and temporary targets are shared through one Session. |
| `relay-use-case-target-reachable-host` | Relay a Service running on another reachable machine or device | Host | Relay proxies a Service that is not bound to the Host’s localhost. |
| `relay-use-case-run-project-configuration` | Start a preconfigured project with `relay` | Host | Relay starts the intended environment without repeating setup choices. |
| `relay-use-case-create-service-configuration` | Create a reusable Service through an interactive wizard | Host | Relay writes or updates the project configuration. |
| `relay-use-case-start-with-browser-wizard` | Configure and approve a Session through the web interface | Host | The Session starts using a guided graphical setup flow. |
| `relay-use-case-start-with-terminal-interface` | Configure and approve a Session without opening a browser | Host | The Session starts through the Ink application. |
| `relay-use-case-run-offline-local-session` | Use Relay locally without internet access | Host | Local transport and setup continue without an account or cloud connection. |
| `relay-use-case-select-session-mode` | Choose Local or Remote transport | Host | The Session uses the appropriate reachability and account model. |
| `relay-use-case-review-resolved-session-policy` | Review the final policy produced from selected Services and overrides | Host | The Host understands the final mode, Replay, storage and access settings before exposure begins. |

The last use case should be made explicit even though the current specification only implies it through setup approval and policy resolution. It prevents a Local Service, for example, from becoming Remote merely because it was combined with a Remote configuration without the Host understanding the result.

---

## 2. Sharing and connecting to Services

Consumers may connect to the whole Session, a named Service or a specific port. They should then use the actual relayed Service rather than a proprietary Relay replacement interface. :chatgpt-content-reference{index="6"}

| ID | Use case | Primary actor | Outcome |
|---|---|---|---|
| `relay-use-case-preview-on-own-device` | Open a local application on the Host’s own phone or tablet | Host | The Host tests their current local build on a real device. |
| `relay-use-case-share-on-local-network` | Share a Service with another local consumer | Host | A nearby device or person accesses the Service without deploying it. |
| `relay-use-case-share-with-remote-consumer` | Share a Service with someone outside the local network | Host | A remote consumer accesses the Host’s current local environment. |
| `relay-use-case-share-complete-environment` | Share an entire multi-Service development environment | Host | Consumers can use the frontend and its supporting APIs, sockets or other Services together. |
| `relay-use-case-connect-to-whole-session` | Connect using the Session-level identity | Consumer | The consumer enters the shared environment and can select or access its included Services. |
| `relay-use-case-connect-to-named-service` | Connect directly to one named Service | Consumer | The consumer lands on the intended Service without first selecting it. |
| `relay-use-case-connect-to-specific-port` | Connect directly to a specific included port | Consumer | The consumer reaches the precise target supplied by the Host. |
| `relay-use-case-connect-by-qr-code` | Join a Session by scanning a QR code | Consumer | A mobile consumer connects without manually entering an address or code. |
| `relay-use-case-connect-by-share-code` | Join using a human-entered share code | Consumer | The consumer joins through the Relay browser experience. |
| `relay-use-case-connect-by-cli` | Join using a Relay CLI command | Consumer | A developer or machine connects from a terminal. |
| `relay-use-case-connect-with-ordinary-client` | Use a standard browser, API client, database client, SSH client or other protocol client | Consumer | The consumer uses the Service through its normal client rather than a Relay-specific replacement. |
| `relay-use-case-connect-without-relay-account` | Join a public Session anonymously | Consumer | A public consumer accesses the Service without creating a Relay identity. |
| `relay-use-case-connect-to-team-only-session` | Join an access-controlled Session as an authenticated team member | Consumer | Only authorised organisation members can use the Session. |
| `relay-use-case-share-consumer-identity` | Voluntarily identify oneself to the Host | Consumer | Comments and activity may be attributed without requiring identity for every public Session. |
| `relay-use-case-use-reusable-alias` | Connect through a stable human-readable alias | Consumer | A recurring workflow uses a memorable identity instead of a new ephemeral code. |
| `relay-use-case-rebind-reusable-alias` | Move an alias to a replacement Session | Host | A new Session takes over a known alias after explicit authentication. |

---

## 3. Service and protocol scenarios

These are variants of the sharing use cases, not separate Relay products. The specification explicitly includes websites, APIs, WebSockets, SSE, webhooks, databases, game servers, SSH and arbitrary TCP. :chatgpt-content-reference{index="7"}

| ID | Scenario | Typical consumer |
|---|---|---|
| `relay-scenario-website` | Relay a website or web application | Browser or Relay mobile application |
| `relay-scenario-api` | Relay an HTTP API | Browser, application, Postman or `curl` |
| `relay-scenario-websocket` | Relay a WebSocket server | Browser or application |
| `relay-scenario-sse` | Relay a Server-Sent Events endpoint | Browser or application |
| `relay-scenario-webhook-receiver` | Receive an external webhook in a local application | Third-party service |
| `relay-scenario-database` | Connect to a local database from another environment | Database CLI or GUI |
| `relay-scenario-ssh` | Connect to a reachable SSH server | SSH client |
| `relay-scenario-game-server` | Connect to a local or development game server | Game client |
| `relay-scenario-arbitrary-tcp` | Connect to any other TCP Service | Protocol-specific client |

The generic client flow still needs a concrete transport design. For example, the specification should eventually state whether a remote database consumer receives a direct endpoint or runs something like `relay connect <code>` to create a local forwarded port.

---

## 4. Multi-consumer testing and validation

Connections are independent, may expose different capabilities and may consume the same Session simultaneously. :chatgpt-content-reference{index="8"}

| ID | Use case | Primary actor | Outcome |
|---|---|---|---|
| `relay-use-case-test-with-multiple-consumers` | Connect several consumers to the same Session | Host | The Host observes simultaneous usage across devices and clients. |
| `relay-use-case-compare-devices` | Compare behaviour across phones, tablets and desktops | Host | Device-specific differences become visible against the same local build. |
| `relay-use-case-compare-browsers` | Compare behaviour across browsers | Host | Browser-specific layout, network or JavaScript issues can be identified. |
| `relay-use-case-test-consumer-specific-failure` | Investigate a problem affecting only one consumer | Host | The failing Connection can be inspected without treating all consumers as equivalent. |
| `relay-use-case-test-independent-consumer-state` | Confirm consumers maintain independent application state | Host | Cookies, navigation and interaction on one Connection do not control another unless the application itself synchronises them. |
| `relay-use-case-test-full-stack-environment` | Exercise frontend, API and supporting Services together | Host | A realistic local system is tested as one shareable environment. |
| `relay-use-case-test-realtime-broadcast` | Trigger one event and observe its effect across multiple consumers | Host | Broadcasts, notifications, sockets or live updates can be validated across devices. |
| `relay-use-case-test-with-nontechnical-consumer` | Let a tester or stakeholder use the application normally | Host | The consumer can report problems without learning development tooling. |
| `relay-use-case-test-during-active-development` | Continue testing while Services rebuild and restart | Host | Normal development interruptions do not require a new sharing workflow. |

---

## 5. Inspecting and controlling Connections

Relay dynamically exposes only the diagnostics and controls supported by each Connection. Website Connections may provide visual state, console, network, DOM and route data, while generic protocols may expose only transport-level information. :chatgpt-content-reference{index="9"} :chatgpt-content-reference{index="10"}

| ID | Use case | Primary actor | Outcome |
|---|---|---|---|
| `relay-use-case-understand-connected-consumers` | See what is currently connected | Host | The Host understands each consumer, its target Service and its current state. |
| `relay-use-case-inspect-connection-context` | Inspect device, platform, route, Service and capability information | Host | The Host understands the environment in which a problem occurred. |
| `relay-use-case-diagnose-client-side-error` | Investigate console errors and browser-side failures | Host | Client-side evidence is available without asking the consumer to open developer tools. |
| `relay-use-case-diagnose-network-failure` | Inspect requests, responses, timings and transport failures | Host | The Host can determine whether a failure occurred in the client, network or upstream Service. |
| `relay-use-case-inspect-current-visual-state` | View a screenshot or live representation of a visual consumer | Host | The Host sees what the consumer is seeing. |
| `relay-use-case-inspect-dom-state` | Examine the consumer’s captured DOM state | Host | The Host can connect visible behaviour to document structure where supported. |
| `relay-use-case-inspect-current-route` | See the consumer’s current route or destination | Host | The Host knows which application state the consumer is using. |
| `relay-use-case-inspect-generic-protocol-activity` | Inspect connection state and transport information for non-visual Services | Host | Database, SSH, game or arbitrary TCP problems can be investigated at the available protocol layer. |
| `relay-use-case-reload-consumer` | Remotely reload a supported Connection | Host or controller | The consumer refreshes without needing verbal instructions. |
| `relay-use-case-navigate-consumer` | Remotely move a supported Connection to another route | Host or controller | The consumer is placed in the state needed for testing. |
| `relay-use-case-interact-with-consumer` | Perform supported DOM, screen or native interactions remotely | Host or controller | The Host can reproduce or demonstrate behaviour through the consumer. |
| `relay-use-case-debug-one-connection-independently` | Inspect or control one Connection without altering the others | Host | A single affected consumer can be investigated in isolation. |
| `relay-use-case-diagnose-cross-service-failure` | Follow a problem through several Services | Host | Evidence from frontend, API, sockets and supporting Services is connected into one investigation. |

---

## 6. Session resilience and lifecycle

Relay Sessions retain stable identity across temporary local Service failure, consumer disconnection and Remote Host connectivity loss. Sessions may also be paused, resumed and intentionally ended. :chatgpt-content-reference{index="11"}

| ID | Use case | Primary actor | Outcome |
|---|---|---|---|
| `relay-use-case-start-before-service-is-ready` | Start Relay while one or more configured Services are unavailable | Host | Relay waits for missing Services while keeping the Session active. |
| `relay-use-case-recover-from-service-restart` | Continue after a local development server restarts | Host | The existing Session, Connections and share identity remain valid. |
| `relay-use-case-recover-from-host-internet-loss` | Continue a Remote Session after temporary Host connectivity loss | Host | Relay reconnects and preserves the Session rather than creating a replacement. |
| `relay-use-case-reconnect-consumer` | Allow a temporarily disconnected consumer to return | Consumer | The consumer returns to the same Session context where possible. |
| `relay-use-case-pause-session` | Temporarily stop normal Service access | Host | Consumers receive an intentional paused state while the Session identity remains reserved. |
| `relay-use-case-resume-session` | Restore access after a pause | Host | Existing consumers continue using the same Session. |
| `relay-use-case-end-session-gracefully` | Intentionally shut down a Session | Host | Consumers receive an explicit end reason rather than an unexplained broken connection. |

---

## 7. Replay and historical investigation

Replay records synchronised historical evidence at Connection and Session level. It supports live scrubbing, markers, notes, comments, storage, export, import and search. :chatgpt-content-reference{index="12"} :chatgpt-content-reference{index="13"} :chatgpt-content-reference{index="14"}

| ID | Use case | Primary actor | Outcome |
|---|---|---|---|
| `relay-use-case-inspect-earlier-live-moment` | Scrub backward while the Session remains live | Host | The Host investigates earlier evidence without interrupting the consumer. |
| `relay-use-case-return-to-live-state` | Return from historical inspection to the current moment | Host | The Host resumes live observation. |
| `relay-use-case-review-connection-history` | Review everything Relay captured for one consumer | Host | A consumer-specific incident can be reconstructed. |
| `relay-use-case-review-session-history` | Review synchronised events across Connections and Services | Host | Cross-device and cross-service behaviour is reconstructed on one timeline. |
| `relay-use-case-mark-important-moment` | Mark the timestamp at which a test action occurs | Host | The relevant moment is easy to find later. |
| `relay-use-case-find-significant-events` | Navigate automatically generated markers | Host | Errors, disconnects, route changes and control changes are surfaced without manual annotation. |
| `relay-use-case-add-host-note` | Add an explanation to a Session, Connection or Service moment | Host | Human intent or context is preserved beside technical evidence. |
| `relay-use-case-submit-consumer-comment` | Report a problem while using the relayed Service | Consumer | The Host receives feedback attached to the exact Connection and time. |
| `relay-use-case-comment-on-visual-location` | Comment on a specific point in a captured visual state | Consumer | The report retains its visual coordinates, frame, route and surrounding evidence. |
| `relay-use-case-review-completed-session` | Inspect Replay after the live Session has ended | Host or Observer | A completed test or incident remains available for investigation. |
| `relay-use-case-store-replay-in-cloud` | Persist Replay in Relay Cloud | Host | The Replay remains available across machines and collaborators according to retention policy. |
| `relay-use-case-store-replay-locally` | Persist Replay on the Host’s own storage | Host | The Host retains greater control over the recorded data. |
| `relay-use-case-export-replay` | Export Replay as transparent files in a `.zip` | Host | Replay data can be archived, inspected or transferred without a proprietary binary container. |
| `relay-use-case-import-replay` | Open an exported Replay in read-only mode | Host or Observer | Historical evidence can be reviewed without restarting the original Session. |
| `relay-use-case-search-current-replay` | Search logs, requests, routes, comments and metadata in one Replay | Host | Relevant evidence can be located without manually scrubbing the entire timeline. |
| `relay-use-case-search-across-replays` | Search retained evidence across several Sessions | Host or team member | Recurring technical evidence can be found across historical Sessions. |

---

## 8. Team collaboration and governance

Teams adds authenticated observation, shared Replay, access restrictions, per-Connection control ownership and immutable audit history. :chatgpt-content-reference{index="15"} :chatgpt-content-reference{index="16"}

| ID | Use case | Primary actor | Outcome |
|---|---|---|---|
| `relay-use-case-observe-live-session` | Join another developer’s Session as an Observer | Observer | A teammate inspects live Relay data without becoming a consumer. |
| `relay-use-case-collaborate-on-replay` | Review the same Replay with teammates | Host or Observer | Several people investigate one shared evidence set. |
| `relay-use-case-collaborate-through-comments` | Discuss a captured problem in context | Host, Observer or Consumer | Conversation remains attached to the relevant recorded moment. |
| `relay-use-case-request-connection-control` | Ask the current controller for control of a Connection | Observer | A teammate may take over supported interaction after approval. |
| `relay-use-case-grant-connection-control` | Hand control of a Connection to another teammate | Current controller | Responsibility changes without ending or reconnecting the consumer. |
| `relay-use-case-control-different-connections-concurrently` | Allow different teammates to control different Connections | Host and Observers | Parallel testing occurs without creating a single global controller lock. |
| `relay-use-case-reclaim-connection-control` | Override control ownership as the original Host | Host | The Session owner retains ultimate authority. |
| `relay-use-case-restrict-session-to-team` | Prevent public consumers from joining | Host | Access is limited to authenticated organisation members. |
| `relay-use-case-audit-human-actions` | Review who performed sensitive actions inside Relay | Host, administrator or authorised Observer | Control changes, exports, comments and configuration actions remain attributable. |
| `relay-use-case-administer-team-access` | Manage organisation membership, roles and permissions | Team administrator | Relay collaboration is governed at organisation level. |
| `relay-use-case-administer-team-subscription` | Manage organisation billing and feature entitlement | Team administrator | Paid Remote, Replay and collaboration capabilities are available to the intended members. |

---

## 9. Explicit post-release use cases

These should remain in the catalogue but be marked as post-release rather than silently mixed into launch requirements. :chatgpt-content-reference{index="17"}

| ID | Use case | Outcome |
|---|---|---|
| `relay-use-case-search-replays-semantically` | Find Sessions based on meaning rather than exact text or structured filters. |
| `relay-use-case-explain-session-failure-with-ai` | Ask Relay why a failure occurred and receive an evidence-linked analysis. |
| `relay-use-case-keep-session-after-terminal-closes` | Allow a persistent daemon to maintain the Session independently of the original CLI. |
| `relay-use-case-add-service-to-running-session` | Add a port or Service without replacing the Session. |
| `relay-use-case-remove-service-from-running-session` | Remove a port or Service while preserving the remaining Session. |
| `relay-use-case-detect-recurring-failures` | Identify repeated patterns across historical Sessions. |
| `relay-use-case-compare-regressions-across-sessions` | Compare current behaviour with earlier captured Sessions. |

---

## Decisions exposed by these use cases

Writing the use cases explicitly reveals five remaining product decisions:

### 1. Ordinary TCP client connection flow

`relay-use-case-connect-with-ordinary-client` needs a defined flow for database, SSH, game and arbitrary TCP clients. QR codes and browser share codes do not fully explain that path.

### 2. Share-code authorisation

A direct code such as `ABC123-api` must be defined as either:

- a destination within Session-wide access, or
- a credential scoped only to that Service.

The current specification does not fully settle this.

### 3. Whole-Session default destination

`relay-use-case-connect-to-whole-session` needs a rule for what visual consumers initially see when the Session contains several Services.

### 4. Browser capability acquisition

The inspection and control use cases require a defined external mechanism for obtaining console, DOM, screen and interaction data without changing the relayed application.

### 5. Premium Local use while offline

`relay-use-case-run-offline-local-session` and the paid Replay use cases need an offline entitlement rule so paid Local capabilities do not require constant cloud access.

---

## Formal use-case schema

Each catalogue entry can now be expanded using this structure:

```md
## relay-use-case-preview-on-own-device

- Status: Launch
- Primary actor: Host
- Supporting actors: Consumer device
- Goal: Open and test a locally running Service on a real phone or tablet.
- Preconditions:
  - The Host can reach the target Service.
  - The consumer device can reach the Local Relay endpoint.
- Trigger:
  - The Host starts Relay and scans the displayed QR code.
- Main flow:
  1. The Host starts Relay for a Service.
  2. Relay creates the Session.
  3. Relay displays a QR code.
  4. The Host scans the code on the consumer device.
  5. Relay creates a Connection.
  6. The consumer opens the relayed Service.
  7. The Host sees the Connection on the Session dashboard.
- Alternate flows:
  - The Service is not yet available.
  - The device cannot reach the Host.
  - The Connection exposes only limited capabilities.
- Result:
  - The Host can use and inspect the local Service on the consumer device.
- Related features:
  - Local transport
  - QR connection
  - Connection dashboard
  - Capability detection
- Related scenarios:
  - Website
  - API
```

This catalogue gives Relay a clear set of user outcomes without confusing them with transport modes, diagnostics panels or individual UI controls.